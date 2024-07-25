import { asyncHandler } from '../utils/asyncHandler.js';
import { apiError } from '../utils/apiError.js';
import { User } from "../models/user.model.js"
import { uploadOnCloudinary } from "../utils/cloudinary.js"
import { apiResponse } from '../utils/apiResponse.js';


const generateAccessAndRefreshTokens = async(userId)=>{
   try{
      const user= await User.findById(userId)
      const accessToken = user.generateAccessToken()
      const refreshToken = user.generateRefreshToken()
      user.refreshToken=refreshToken
      await user.save({validateBeforeSave: false})
      return {accessToken,refreshToken}

   }catch(error){
         throw new apiError(500,"Something went wrong while genrating the access and referesh token");
   }

}

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
   const existedUser = await User.findOne({
      $or: [{ username }, { email }]
   })
   if (existedUser) {
      throw new apiError(409, "User with email or username already exists")
   }
   //(4)
   //Optional Chaining
   const avatarLocalPath = req.files?.avatar[0]?.path;
   // const coverImageLocalPath = req.files?.coverImage[0]?.path;
   let coverImageLocalPath;
   if (req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0) {
      coverImageLocalPath = req.files?.coverImage[0]?.path;
   }

   if (!avatarLocalPath) {
      throw new apiError(400, "Avatar file is required")
   }
   //(5)
   const avatar = await uploadOnCloudinary(avatarLocalPath);
   const coverImage = await uploadOnCloudinary(coverImageLocalPath);
   if (!avatar) {
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
   if (!createdUser) {
      throw new apiError(500, "Something went wrong while registering the user");
   }
   //(9)
   return res.status(201).json(
      new apiResponse(200, createdUser, " User registered successfully")
   )


})

const loginUser = asyncHandler(async (req, res) => {
   //req body -->data
   //username or email basis verification
   //find the user
   //password check
   //access and refresh token gen.
   //send as secured cookies

   //req body --> data
   const { email, username, password } = req.body;
   //username or email basis verification
   if (!username || !email) {
      throw new apiError(400, "Username and E-mail is required");
   }
   //find the user
   const user = User.findOne({
      $or: [{ username }, { email }]
   })

   if (!user) {
      throw new apiError(404, "User does not exist");
   }
   //password check
   const isPasswordValid = await user.isPasswordCorrect(password)
   if (!isPasswordValid) {
      throw new apiError(401, "Invalid User Credentials");
   }
   //access and refresh token gen.
   const {accessToken, refreshToken}= await generateAccessAndRefreshTokens(user._id)
   //we don't want to send everthing so,
   const loggedInUser= await User.findById(user._id)
   .select("-password -refreshToken")
   //send as secured cookies
   const options={
      httpOnly:true,
      secure:true
   }
   return res
   .status(200)
   .cookie("accessToken",accessToken,options)
   .cookie("refreshToken",refreshToken,options)
   .json(
      new apiResponse(
         200,
         {
            user:loggedInUser, 
            accessToken, 
            refreshToken
         },
         "User logged in Successfully"
      )
   )

})

const logoutUser = asyncHandler(async (req,res) => {
    await User.findByIdAndUpdate(
      req.user._id,
      {
         $set:{
            refreshToken: undefined
         }
      },
      {
         new: true
      }

    )

   const options = {
      httpOnly: true,
      secure: true
   }

   return res
   .status(200)
   .clearCookie("accessToken", options)
   .clearCookie("refreshToken", options)
   .json(
      new apiResponse(
         200,
         {},
         "User logged out Successfully"
      )
   )

})


export {
   registerUser,
   loginUser,
   logoutUser,
}