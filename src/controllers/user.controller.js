import { asyncHandler } from '../utils/asyncHandler.js';
import { apiError } from '../utils/apiError.js';
import { User } from "../models/user.model.js"
import { uploadOnCloudinary } from "../utils/cloudinary.js"
import { apiResponse } from '../utils/apiResponse.js';

const registerUser = asyncHandler(async (req, res) => {
   // 1. get user details from frontend
   // 2. validation - not empty(mandatory)
   // 3. check if user already exists: username, email
   // 4. check for images, check for avatar (multer working check)
   // 5. upload them to cloudinary, check whether uploaded or not
   // 6. create user object-> create entry in DB
   // 7. remove password and refresh token field from response
   // 8. check for user creation
   // 9. return res

   //(1)
   const { fullName, email, username, password } = req.body

   //(2)
   //  if(fullName===""){
   //    throw new apiError(400,"fullname is required")
   //  }
   //OR
   // If at least one element in the array is either null, undefined, or an empty string (after trimming), the condition inside the if statement will be true.
   if ([fullName, email, username, password].some((field) => field?.trim() === "")) {
      throw new apiError(400, "All fields are required");
   }
   //(3)
   const existedUser=await User.findOne({
      $or:[{username},{email}]
   })
   if(existedUser){
      throw new apiError(409,"User with email or username already exists")
   }
   //(4)
   //Optional Chaining
   const avatarLocalPath = req.files?.avatar[0]?.path;
   // const coverImageLocalPath = req.files?.coverImage[0]?.path;
   let coverImageLocalPath;
   if(req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length>0 ){
      coverImageLocalPath = req.files?.coverImage[0]?.path;
   }

   if(!avatarLocalPath){
      throw new apiError(400,"Avatar file is required")
   }
   //(5)
   const avatar = await uploadOnCloudinary(avatarLocalPath);
   const coverImage = await uploadOnCloudinary(coverImageLocalPath);
   if(!avatar){
      throw new apiError(400, "Avatar file is required")
   }
   //(6)
   const user = await User.create({
      fullName,
      avatar: avatar.url,
      coverImage: coverImage?.url || "",
      email,
      password,
      username: username.toLowerCase()
   })
   //(8)
   const createdUser = await User.findById(user._id).select(
      "-password -refreshToken"
   );
   if(!createdUser){
      throw new apiError(500,"Something went wrong while registering the user");
   }
   //(9)
   return res.status(201).json(
      new apiResponse(200, createdUser, " User registered successfully")
   )


})


export { registerUser }