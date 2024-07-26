import { asyncHandler } from '../utils/asyncHandler.js';
import { apiError } from '../utils/apiError.js';
import jwt from 'jsonwebtoken';
import { User } from "../models/user.model.js"

export const verifyJWT = asyncHandler(async(req,res,next)=>{
    try {
        // Extract the token from cookies or the Authorization header
        const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ","")
        // If no token is found, throw an unauthorized error
        if(!token){
          throw new apiError(401,"Unauthorized request")   
        }
        // Verify the token using the secret key
        const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET)
        
        // Find the user by the ID encoded in the token, excluding password and refreshToken fields
        const user = await User.findById(decodedToken?._id)
        .select("-password -refreshToken")
    
        if(!user){
            throw new apiError(401, "Invalid Access Token")
        }
        //adding a method "user" to request obj.
        //Attach the user information to the request object
        req.user=user;
        // Pass control to the next middleware or route handler
        next()
    } catch (error) {
        throw new apiError(401,error?.message || "Invalid access token")
    }

})