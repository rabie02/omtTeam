// const express = require('express');
// const router = express.Router();
// const axios = require('axios');
// const crypto = require('crypto');
// const nodemailer = require('nodemailer');
// const bcrypt = require('bcrypt');
// require('dotenv').config();

// // In-memory store for pending registrations (See notes above about persistence)
// const pendingRegistrations = new Map();

// // Email configuration
// const transporter = nodemailer.createTransport({
//   service: process.env.EMAIL_SERVICE || 'Gmail',
//   auth: {
//     user: process.env.EMAIL_USER,
//     pass: process.env.EMAIL_PASS
//   },
//   // Optional: Disable strict TLS if needed for self-signed certs, etc. - use with caution
//   // tls: {
//   //   rejectUnauthorized: false
//   // }
// });

// // --- HTML Templates ---
// const successHtml = `
// <!DOCTYPE html>
// <html>
// <head>
//   <title>Registration Complete</title>
//   <meta name="viewport" content="width=device-width, initial-scale=1.0">
//   <meta http-equiv="Content-Security-Policy" content="default-src 'self' data:; style-src 'self' 'unsafe-inline';">
//   <style>
//     body { font-family: Arial, sans-serif; text-align: center; padding: 50px 20px; background-color: #f4f4f4; color: #333; }
//     .container { background-color: #fff; padding: 30px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1); max-width: 500px; margin: auto; }
//     .success { color: #4CAF50; font-size: 28px; margin-bottom: 20px; font-weight: bold; }
//     .login-btn {
//       background-color: #4CAF50; color: white; padding: 12px 24px;
//       text-decoration: none; border-radius: 5pm; display: inline-block;
//       margin-top: 20px; font-size: 18px;
//       transition: background-color 0.3s ease;
//     }
//      .login-btn:hover {
//        background-color: #45a049;
//      }
//   </style>
// </head>
// <body>
//   <div class="container">
//     <div class="success">✓ Registration Successful</div>
//     <p>Your account has been created successfully.</p>
//     <p>You can now log in to your account.</p>
//     <a href="${process.env.FRONTEND_URL}/login" class="login-btn">Go to Login</a>
//   </div>
// </body>
// </html>
// `;

// const errorHtml = `
// <!DOCTYPE html>
// <html>
// <head>
//   <title>Registration Error</title>
//    <meta name="viewport" content="width=device-width, initial-scale=1.0">
//    <meta http-equiv="Content-Security-Policy" content="default-src 'self' data:; style-src 'self' 'unsafe-inline';">
//   <style>
//     body { font-family: Arial, sans-serif; text-align: center; padding: 50px 20px; background-color: #f4f4f4; color: #333; }
//     .container { background-color: #fff; padding: 30px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1); max-width: 500px; margin: auto; }
//     .error { color: #f44336; font-size: 28px; margin-bottom: 20px; font-weight: bold; }
//     .retry-btn {
//       background-color: #f44336; color: white; padding: 12px 24px;
//       text-decoration: none; border-radius: 5px; display: inline-block;
//       margin-top: 20px; font-size: 18px;
//       transition: background-color 0.3s ease;
//     }
//      .retry-btn:hover {
//        background-color: #d32f2f;
//      }
//   </style>
// </head>
// <body>
//   <div class="container">
//     <div class="error">✗ Registration Failed</div>
//     <p>The registration link is invalid or has expired.</p>
//     <p>Please try registering again.</p>
//     <a href="${process.env.FRONTEND_URL}/register" class="retry-btn">Try Again</a>
//   </div>
// </body>
// </html>
// `;

// // --- Helper Functions ---

// // Helper function to validate location coordinate values
// const validateCoordinates = (latitude, longitude) => {
//   if (typeof latitude !== 'number' || typeof longitude !== 'number') {
//     console.warn(`Validation failed: lat/lng not numbers -> lat: ${latitude}, lng: ${longitude}`);
//     return false;
//   }
//   if (Math.abs(latitude) > 90 || Math.abs(longitude) > 180) {
//     console.warn(`Validation failed: lat/lng out of range -> lat: ${latitude}, lng: ${longitude}`);
//     return false;
//   }
//   console.log("Validation successful: location coordinates valid");
//   return true;
// };


// // Reverse geocoding function using OpenStreetMap Nominatim
// const getAddressFromCoordinates = async (latitude, longitude) => {
//   console.log(`Attempting geocoding for lat: ${latitude}, lng: ${longitude} using Nominatim`);

//   // Public Nominatim API URL (Subject to usage policy!)
//   const apiUrl = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}`;

//   try {
//     const response = await axios.get(apiUrl, {
//       timeout: 10000, // Increased timeout slightly
//       headers: {
//         // IMPORTANT: Add a clear User-Agent string identifying your application
//         // and a Referer header (if applicable, though less critical for backend calls)
//         'User-Agent': `${process.env.APP_NAME || 'locationregister'}/1.0 (clothesall2@gmail.com)`, // Replace with your email
//         'Referer': process.env.BACKEND_URL || 'http://localhost', // Indicate where the request originates
//         'Accept-Language': 'en'  // Change to your preferred language
      
//       }
//     });

//     const data = response.data;
//     console.log("Raw geocoding response received from Nominatim.");
//      // console.debug("Raw geocoding response body:", JSON.stringify(data, null, 2)); // Use debug for large output

//     let addressDetails = {
//       address: '',
//       city: '',
//       state: '',
//       country: '',
//       postalCode: '',
//     };

//     // Parse Nominatim response (jsonv2 format)
//     if (data && data.address) {
//       const addr = data.address;
//       // Concatenate relevant address parts. Filter(Boolean) removes undefined/null/empty strings.
//       addressDetails.address = [
//         addr.house_number,
//         addr.street,
//         addr.road, // Sometimes 'road' is used instead of 'street'
//         addr.residential,
//         addr.building,
//         addr.commercial, // e.g., shop name
//         addr.tourism, // e.g., place of interest name
//         addr.leisure // e.g., park name
//       ].filter(Boolean).join(' ');

//       addressDetails.city = addr.city || addr.town || addr.village || addr.hamlet || addr.municipality || addr.county || '';
//       addressDetails.state = addr.state || addr.region || '';
//       addressDetails.country = addr.country || '';
//       addressDetails.postalCode = addr.postcode || '';

//        // Refine address string if it's just neighborhood/suburb without street
//        if (addressDetails.address === '' && (addr.neighbourhood || addr.suburb)) {
//             addressDetails.address = addr.neighbourhood || addr.suburb;
//        }

//     } else {
//         console.warn(`Geocoding response from Nominatim missing address data for lat: ${latitude}, lng: ${longitude}`, data);
//     }

//     console.log("Parsed address details:", addressDetails);
//     // Return empty details on error or no data found, as frontend expects this structure
//     return addressDetails;

//   } catch (error) {
//     console.error('Nominatim API error:', {
//       message: error.message,
//       status: error.response?.status, // Log the HTTP status code if available
//       statusText: error.response?.statusText,
//       url: apiUrl,
//       // Log response data only if it exists and is not too large
//       response_data_preview: error.response?.data ? JSON.stringify(error.response.data).substring(0, 200) + '...' : 'N/A',
//        // For Nominatim errors, rate limits often return 429 or 403
//        // It's crucial to handle these gracefully or you might get blocked.
//     });

//     // Return empty details on error, as frontend expects this structure
//     return {
//       address: '',
//       city: '',
//       state: '',
//       country: '',
//       postalCode: ''
//     };
//   }
// };


// // Registration request endpoint (sends confirmation email)
// router.post('/request-creation', async (req, res) => {
//   try {
//     console.log("Received registration request.");
//      // console.debug("Request body:", JSON.stringify(req.body, null, 2)); // Use debug for sensitive data

//     const { type, first_name, last_name, email, mobile_phone, password, company_name, location } = req.body;

//     // Basic input sanitization (optional but recommended)
//     const sanitizedEmail = email?.trim().toLowerCase();
//     const sanitizedFirstName = first_name?.trim();
//     const sanitizedLastName = last_name?.trim();
//     const sanitizedMobilePhone = mobile_phone?.trim();
//     const sanitizedCompanyName = company_name?.trim();

//     // Validate required fields (using sanitized data)
//     const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/i; // Case-insensitive email validation
//     const phoneRegex = /^[+]?[0-9\s-()]{10,20}$/; // Still using the flexible regex

//     const validationErrors = {};

//     if (!sanitizedFirstName || sanitizedFirstName.length < 2) validationErrors.first_name = "First name must be at least 2 characters";
//     if (!sanitizedLastName || sanitizedLastName.length < 2) validationErrors.last_name = "Last name must be at least 2 characters";
//     if (!sanitizedEmail || !emailRegex.test(sanitizedEmail)) validationErrors.email = "Please enter a valid email address";
//     if (!sanitizedMobilePhone || !phoneRegex.test(sanitizedMobilePhone)) validationErrors.mobile_phone = "Please enter a valid phone number (10-20 digits)";
//     if (!password || password.length < 6) validationErrors.password = "Password must be at least 6 characters"; // Password will be hashed
//     if (type === 'company' && (!sanitizedCompanyName || sanitizedCompanyName.length < 2)) validationErrors.company_name = "Company name must be at least 2 characters";

//      // Validate location coordinates (address details are optional but coordinates are needed)
//      if (!location || !validateCoordinates(location.latitude, location.longitude)) {
//          validationErrors.location = "Valid location coordinates are required.";
//      }


//     if (Object.keys(validationErrors).length > 0) {
//       console.warn("Validation failed:", validationErrors);
//       return res.status(400).json({
//         success: false,
//         error: 'validation_failed',
//         message: 'Validation failed',
//         fields: validationErrors
//       });
//     }

//      // Hash the password BEFORE storing it in pendingRegistrations
//      const hashedPassword = await bcrypt.hash(password, 10); // Use a salt round of 10 or more

//      // Store address details received from frontend along with coordinates
//      const registrationData = {
//         type,
//         first_name: sanitizedFirstName,
//         last_name: sanitizedLastName,
//         email: sanitizedEmail,
//         mobile_phone: sanitizedMobilePhone,
//         password: hashedPassword, // Store hashed password
//         company_name: sanitizedCompanyName,
//         location: { // Store the location object as received, including address details
//            latitude: location.latitude,
//            longitude: location.longitude,
//            address: location.address || '', // Ensure empty strings if null/undefined
//            city: location.city || '',
//            state: location.state || '',
//            country: location.country || '',
//            postalCode: location.postalCode || '',
//         }
//      };


//     // Check if email exists in ServiceNow
//     try {
//       if (!process.env.SERVICE_NOW_URL || !process.env.SERVICE_NOW_USER || !process.env.SERVICE_NOW_PASSWORD) {
//            console.error("ServiceNow environment variables are not fully set.");
//            return res.status(500).json({
//               success: false,
//               error: 'servicenow_config_missing',
//               message: 'Server configuration error. Cannot check email availability.'
//            });
//       }

//       const basicAuth = `Basic ${Buffer.from(`${process.env.SERVICE_NOW_USER}:${process.env.SERVICE_NOW_PASSWORD}`).toString('base64')}`;
//       const serviceNowConfig = {
//         headers: {
//           'Content-Type': 'application/json',
//           'Accept': 'application/json',
//           'Authorization': basicAuth
//         },
//         timeout: 15000
//       };

//        console.log(`Checking email existence in ServiceNow: ${sanitizedEmail}`);
//       const emailCheck = await axios.get(
//         `${process.env.SERVICE_NOW_URL}/api/now/table/customer_contact?sysparm_query=email=${encodeURIComponent(sanitizedEmail)}`,
//         serviceNowConfig
//       );

//       if (emailCheck.data?.result?.length > 0) {
//         console.warn(`Email ${sanitizedEmail} already exists`);
//         return res.status(409).json({
//           success: false,
//           error: 'email_exists',
//           message: 'This email is already registered.'
//         });
//       }
//        console.log(`Email ${sanitizedEmail} does not exist in ServiceNow.`);
//     } catch (snError) {
//       console.error('ServiceNow email check error:', {
//          message: snError.message,
//          status: snError.response?.status,
//          statusText: snError.response?.statusText,
//          response_data_preview: snError.response?.data ? JSON.stringify(snError.response.data).substring(0, 200) + '...' : 'N/A',
//       });
//       return res.status(500).json({
//         success: false,
//         error: 'servicenow_check_failed',
//         message: 'Could not verify email existence. Please try again later.'
//       });
//     }

//     // Generate confirmation token
//     const token = crypto.randomBytes(32).toString('hex');
//     const expiresAt = Date.now() + 3600000; // 1 hour expiration

//     // Store registration data with hashed password and received address details
//     pendingRegistrations.set(token, {
//       userData: registrationData, // Store the validated and processed data
//       expiresAt
//     });

//     // Set automatic cleanup (still in-memory, see notes)
//     setTimeout(() => {
//       if (pendingRegistrations.has(token)) {
//         pendingRegistrations.delete(token);
//         console.log(`Cleaned up expired token: ${token}`);
//       }
//     }, 3600000 + 5000); // Add a small buffer just in case

//     // Send confirmation email
//      if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS || !process.env.BACKEND_URL || !process.env.APP_NAME) {
//           console.error("Email sending environment variables are not fully set.");
//            // Clean up the pending registration since email can't be sent
//            pendingRegistrations.delete(token);
//            return res.status(500).json({
//               success: false,
//               error: 'email_config_missing',
//               message: 'Server configuration error. Cannot send confirmation email.'
//            });
//      }

//     const confirmationLink = `${process.env.BACKEND_URL}/api/confirm-creation?token=${token}`;

//     try {
//       await transporter.sendMail({
//         from: `"${process.env.APP_NAME}" <${process.env.EMAIL_USER}>`,
//         to: registrationData.email, // Use sanitized email
//         subject: `Confirm Your ${process.env.APP_NAME} Registration`,
//         html: `
//           <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px; background-color: #f9f9f9;">
//             <h2 style="color: #3498db; text-align: center;">Confirm Your Registration</h2>
//             <p>Hello ${registrationData.first_name},</p>
//             <p>Thank you for registering with ${process.env.APP_NAME}.</p>
//             <p>Please click the button below to complete your registration:</p>
//             <div style="text-align: center; margin: 30px 0;">
//               <a href="${confirmationLink}"
//                  style="background-color: #3498db; color: white; padding: 12px 24px;
//                         text-decoration: none; border-radius: 5px; display: inline-block;
//                         font-size: 16px; font-weight: bold;">
//                 Confirm Registration
//               </a>
//             </div>
//             <p style="font-size: 12px; color: #777;">This link will expire in 1 hour.</p>
//             <p style="font-size: 12px; color: #777;">If you didn't request this registration, please ignore this email.</p>
//             <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
//             <p style="text-align: center; font-size: 10px; color: #aaa;">&copy; ${new Date().getFullYear()} ${process.env.APP_NAME}. All rights reserved.</p>
//           </div>
//         `
//       });
//       console.log(`Confirmation email sent to ${registrationData.email}`);
//     } catch (mailError) {
//       console.error('Email sending error:', mailError.message);
//       // Clean up the pending registration since email failed
//       pendingRegistrations.delete(token);
//       return res.status(500).json({
//         success: false,
//         error: 'email_send_failed',
//         message: 'Could not send confirmation email. Please verify your email address and try again.',
//          details: mailError.message
//       });
//     }

//     return res.status(200).json({
//       success: true,
//       message: 'Confirmation email sent. Please check your inbox to complete your registration.',
//        email: registrationData.email
//     });

//   } catch (error) {
//     console.error('Registration request unexpected error:', error.message, error.stack);
//     return res.status(500).json({
//       success: false,
//       error: 'server_error',
//       message: 'An unexpected error occurred during registration. Please try again later.'
//     });
//   }
// });


// router.get('/confirm-creation', async (req, res) => {
//   try {
//     const { token } = req.query;
//     console.log('Confirmation attempt with token received.');

//     if (!token) {
//       console.warn('No token provided in confirmation link.');
//       return res.status(400).send(errorHtml);
//     }

//     const registration = pendingRegistrations.get(token);
//     if (!registration) {
//       console.warn('Invalid or missing token:', token);
//       return res.status(400).send(errorHtml);
//     }

//     if (Date.now() > registration.expiresAt) {
//       console.warn('Expired token:', token);
//       pendingRegistrations.delete(token);
//       return res.status(400).send(errorHtml);
//     }

//     const user = registration.userData;
//     console.log("Processing confirmed registration for:", user.email);

//     // Check ServiceNow config
//     if (!process.env.SERVICE_NOW_URL || !process.env.SERVICE_NOW_USER || !process.env.SERVICE_NOW_PASSWORD) {
//       console.error("ServiceNow environment variables missing during confirmation.");
//       pendingRegistrations.delete(token);
//       return res.status(500).send(errorHtml);
//     }

//     // Prepare ServiceNow API config
//     const basicAuth = `Basic ${Buffer.from(`${process.env.SERVICE_NOW_USER}:${process.env.SERVICE_NOW_PASSWORD}`).toString('base64')}`;
//     const serviceNowConfig = {
//       headers: {
//         'Content-Type': 'application/json',
//         'Accept': 'application/json',
//         'Authorization': basicAuth
//       },
//       timeout: 20000
//     };

//     try {
//       const storedAddressDetails = user.location || { address: '', city: '', state: '', country: '', postalCode: '' };

//       // 1. Create Account (FIRST)
//       const accountPayload = {
//         name: user.type === 'company' ? user.company_name : `${user.first_name} ${user.last_name}'s`,
//         account_type: user.type === 'company' ? 'business' : 'individual',
//         phone: user.mobile_phone || '',
//         email: user.email
//       };

//       console.log("Creating Account record...");
//       const accountResponse = await axios.post(
//         `${process.env.SERVICE_NOW_URL}/api/now/table/customer_account`,
//         accountPayload,
//         serviceNowConfig
//       );
//       const accountSysId = accountResponse.data?.result?.sys_id;
//       if (!accountSysId) throw new Error("Account creation failed: Missing sys_id.");
//       console.log('Account created with Sys ID:', accountSysId);

//       // 2. Create Contact (SECOND, linked to Account)
//       const contactPayload = {
//         first_name: user.first_name,
//         last_name: user.last_name,
//         name: `${user.first_name} ${user.last_name}`,
//         email: user.email,
//         phone: user.mobile_phone || '',
//         account: accountSysId, // Link to Account
//         user_password: user.password, // Hashed password
//         is_primary_contact: true,
//         active: true,
//         ...(user.type === 'company' && { job_title: user.job_title || 'Representative' })
//       };

//       console.log("Creating Contact record...");
//       const contactResponse = await axios.post(
//         `${process.env.SERVICE_NOW_URL}/api/now/table/customer_contact?sysparm_input_display_value=true`,
//         contactPayload,
//         serviceNowConfig
//       );
//       const contactSysId = contactResponse.data?.result?.sys_id;
//       if (!contactSysId) throw new Error("Contact creation failed: Missing sys_id.");
//       console.log('Contact created with Sys ID:', contactSysId);

//       // 3. Create Location (LAST, linked to Account via u_account)
//       const locationPayload = {
//         name: `${user.first_name} ${user.last_name}'s Location`,
//         latitude: user.location?.latitude?.toString() || '',
//         longitude: user.location?.longitude?.toString() || '',
//         street: storedAddressDetails.address || 'Not specified',
//         city: storedAddressDetails.city || 'Unknown',
//         state: storedAddressDetails.state || 'Unknown',
//         country: storedAddressDetails.country || 'Unknown',
//         zip: storedAddressDetails.postalCode || '00000',
//         u_street_address_2: '',
//         u_county: '',
//         u_geocode_accuracy: storedAddressDetails.address ? 'ROOFTOP' : 'APPROXIMATE',
//         u_account: accountSysId // Link Location back to Account (as requested)
//       };

//       console.log("Creating Location record...");
//       const locationResponse = await axios.post(
//         `${process.env.SERVICE_NOW_URL}/api/now/table/cmn_location`,
//         locationPayload,
//         serviceNowConfig
//       );
//       const locationSysId = locationResponse.data?.result?.sys_id;
//       if (!locationSysId) throw new Error("Location creation failed: Missing sys_id.");
//       console.log('Location created with Sys ID:', locationSysId);
      
//       // 4. Link Location to Account via account_address_relationship
//       const relationshipPayload = {
//         account: accountSysId,
//         location: locationSysId,
//         type: 'Primary', // or 'Billing', 'Shipping', etc., depending on your use case
//         is_primary: true
//       };

//       console.log("Creating Account-Location relationship...");
//       const relationshipResponse = await axios.post(
//         `${process.env.SERVICE_NOW_URL}/api/now/table/account_address_relationship`,
//         relationshipPayload,
//         serviceNowConfig
//       );
//       const relationshipSysId = relationshipResponse.data?.result?.sys_id;
//       if (!relationshipSysId) throw new Error("Relationship creation failed: Missing sys_id.");
//       console.log('Account-Location relationship created with Sys ID:', relationshipSysId);


//       // Cleanup
//       pendingRegistrations.delete(token);
//       console.log(`Successfully processed token: ${token}`);
//       return res.send(successHtml);

//     } catch (snError) {
//       console.error('ServiceNow error:', {
//         message: snError.message,
//         status: snError.response?.status,
//         data: snError.response?.data ? JSON.stringify(snError.response.data).substring(0, 200) + '...' : 'N/A',
//       });
//       return res.status(500).send(errorHtml);
//     }

//   } catch (error) {
//     console.error('Unexpected error:', error.message, error.stack);
//     return res.status(500).send(errorHtml);
//   }
// });

// // Reverse geocode endpoint for frontend map display (using Nominatim)
// router.get('/reverse-geocode', async (req, res) => {
//   try {
//     const { lat, lng } = req.query;

//     if (!lat || !lng) {
//       console.warn('Reverse geocode request missing lat/lng');
//       return res.status(400).json({ error: 'Latitude and longitude are required' });
//     }

//     const latitude = parseFloat(lat);
//     const longitude = parseFloat(lng);

//      // Basic validation of coordinates
//     if (!validateCoordinates(latitude, longitude)) {
//        return res.status(400).json({ error: 'Invalid latitude or longitude values' });
//     }

//     // Use the Nominatim function to get address details
//     const addressDetails = await getAddressFromCoordinates(latitude, longitude);

//     // Always return a 200 even if geocoding failed, but return empty details.
//     res.json(addressDetails);

//   } catch (error) {
//     console.error('Error in /reverse-geocode endpoint:', error);
//     // Return empty details on unexpected error, as the frontend needs the structure
//     res.status(500).json({ address: '', city: '', state: '', country: '', postalCode: '', error: 'Failed to process geocoding request' });
//   }
// });


// module.exports = router;