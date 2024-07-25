import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

const app=express();

// Enabling CORS (Cross-Origin Resource Sharing) for the application
app.use(cors({
    // Allow requests only from the specified origin
    origin:process.env.CORS_ORIGIN,
    // Allow credentials (cookies, authorization headers, etc.) to be included in requests
    credentials:true,
}))

// Parse incoming JSON requests with a payload limit of 16kb
// express.json(): Middleware to parse incoming JSON requests
app.use(express.json({limit:"16kb"}))

// Parse incoming URL-encoded form data with extended syntax and a payload limit of 16kb
// express.urlencoded(): Middleware to parse incoming URL-encoded form data.
app.use(express.urlencoded({
    extended:true,
    limit:"16kb",
}))
// Serve static files from the "public" directory
app.use(express.static("public"))

// Parse cookies attached to client requests
// cookieParser(): Middleware to parse cookies attached to client requests, making them accessible via req.cookies.
app.use(cookieParser())

///routes import
import userRouter from './routes/user.routes.js';


//routes declaration
app.use("/api/v1/users",userRouter)

// http://localhost:8000/api/v1/users/register


export {app}
