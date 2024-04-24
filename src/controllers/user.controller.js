import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import  jwt  from "jsonwebtoken";

const registerUser = asyncHandler(async (req, res) => {
  //to get user details from frontend

  const { userName, email, fullName, password } = req.body;

  //validation empty
  if (!userName || !email || !fullName || !password) {
    throw new ApiError(400, "Please Fill All Details");
  }

  //check if user already exists
  const existedUser = await User.findOne({
    $or: [{ userName }, { email }],
  });
  if (existedUser) {
    throw new ApiError(409, "User Already exists");
  }

  // check for image for avtar
  const avatarLocalPath = req.files?.avatar[0]?.path;
  // const coverImageLocalPath = req.files?.coverImage[0]?.path;

  let coverImageLocalPath;
  if (
    req.files &&
    req.files.coverImage.length > 0 &&
    Array.isArray(req.files.coverImage)
  ) {
    coverImageLocalPath = req.files.coverImage[0].path;
  }

  // const coverImageLocalPath = req.files?.coverImage?.[0]?.path;

  if (!avatarLocalPath) {
    throw new ApiError(400, "Avtar files are required");
  }

  //upload them to cloudinary,avtar

  const avatar = await uploadOnCloudinary(avatarLocalPath);
  const coverImage = await uploadOnCloudinary(coverImageLocalPath);

  if (!avatar) {
    throw new ApiError(400, "Files Are Not Supported");
  }

  //create user object - create entry in db

  const user = await User.create({
    fullName,
    avatar: avatar.url,
    coverImage: coverImage?.url || "",
    email,
    password,
    userName: userName.toLowerCase(),
  });

  //remove password and refresh token file

  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  //check for user creatin

  if (!createdUser) {
    throw new ApiError(500, "Something went wrong While registering the user");
  }

  //return response

  res
    .status(201)
    .json(new ApiResponse(200, createdUser, "User created successfully"));
});

const generateAccessTokenandGenerateRefreshToken = async (userId) => {
  try {
    const user = await User.findById(userId);
    const refreshToken = user.generateRefreshToken();
    const accessToken = user.generateAccessToken();

    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    return { accessToken, refreshToken };
  } catch (error) {
    throw new ApiError(
      500,
      "Something  went wrong while generating access token"
    );
  }
};

const loginUser = asyncHandler(async (req, res) => {
  //req body-> data
  //username or email
  //find the user
  //password check
  //access token and refresh token
  //SEND COOKIES
  const { userName, password, email } = req.body;
  if (!userName || !password) {
    throw new ApiError(403, "Please field all details");
  }
  const user = await User.findOne({ $or: [{ userName }, { email }] });
  if (!user) throw new ApiError(404, "User Not Found");
  const isPasswordValid = await user.isPasswordCorrect(password);
  if (!isPasswordValid) {
    throw new ApiError(401, "Password Mismatch");
  }
  const { accessToken, refreshToken } =
    await generateAccessTokenandGenerateRefreshToken(user._id);

  const loggedUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );
  //own try to refresh
  if (!loggedUser) {
    throw new ApiError(500, "Something went wrong While logged the user");
  }

  const options = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options, options)
    .json(
      new ApiResponse(
        200,
        {
          user: loggedUser,
          accessToken,
          refreshToken,
        },
        "User Logged In Successfully"
      )
    );
});
const logOutUser = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(
    req.user._id,
    {
      $set: {
        refreshToken: undefined,
      },
    },
    {
      new: true,
    }
  );
  const options = {
    httpOnly: true,
    secure: true,
  };
  return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "User Is SuccessfulLY Log Out"));
});

const refreshAccessToken = asyncHandler(async (req, res) => {
  const incomingRefreshToken =
    req.cookies.refreshToken || req.body.refreshToken;

  if (!incomingRefreshToken) {
    throw new ApiError(401, "unauthorized request");
  }
  try {
    const decodedToken = jwt.verify(
      incomingRefreshToken,
      process.env.REFRESH_TOKEN_SECRTE
    );
    const user = await User.findById(decodedToken?._id);
    if (!user) {
      throw new ApiError(401, "Invalid refresh token");
    }
    if (incomingRefreshToken !== user?.refreshToken) {
      throw new ApiError(401, "Refresh token is expired or used");
    }
    const options = {
      httpOnly: true,
      secure: true,
    };
    const { accessToken, newRefreshToken } =
      await generateAccessTokenandGenerateRefreshToken(user._id);
    return res
      .status(200)
      .clearCookie("accessToken", accessToken, options)
      .clearCookie("refreshToken", newRefreshToken, options)
      .json(
        new ApiResponse(
          200,
          { accessToken, refreshToken: newRefreshToken },
          "Access token refreshed"
        )
      );
  } catch (error) {
    throw new ApiError(401, error?.message || "Invalid refresh token");
  }
});

export { registerUser, loginUser, logOutUser, refreshAccessToken };
