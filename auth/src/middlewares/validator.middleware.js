const {body, validationResult} = require('express-validator');

const respondWithValidationErrors = (req, res, next) => {
    const errors = validationResult(req);
    if(!errors.isEmpty()){
        return res.status(400).json({
            errors:errors.array()
        });
    }
     next();
}

const registerUserValidations = [
    body("username")
        .isString()
        .withMessage("Username must be a string!")
        .isLength({min:3})
        .withMessage("Username must be at least 3 characters long!"),
    body("email")
        .isEmail()
        .withMessage("Invalid email address!"),
    body("password")
        .isLength({min:6})
        .withMessage("Password must be at least 6 characters long!"),
    body("fullName.firstName")
        .isString()
        .withMessage("First name must be a string")
        .notEmpty()
        .withMessage("First name is required"),
    body("fullName.lastName")
        .isString()
        .withMessage("lastName must be a string")
        .notEmpty()
        .withMessage("lastName is required"),
    respondWithValidationErrors
]

const loginUserValidations = [
    body('email')
        .optional()
        .isEmail()
        .withMessage('Invalid email address!'),
    body("username")
        .optional()
        .isString()
        .withMessage("Username must be a string!"),
    body("password")
        .isLength({min:6})
        .withMessage("Password must be at least 6 characters long!"),
    (req, res, next)=>{``

        if(!req.body.email && !req.body.username){
            return res.status(400).json({
                errors:[
                    {
                        message:"Either email or username is required!"
                    }
                ]
            })
        }

        respondWithValidationErrors(req, res, next)
    }
    
]

const addUserAddressValidatoins=[
    body('street')
       .isString()
       .withMessage("Street must be a string")
       .notEmpty()
       .withMessage("Street is required!"),
    body('city')
       .isString()
       .withMessage("City must be a string")
       .notEmpty()
       .withMessage("City is required!"),
    body('state')
       .isString()
       .withMessage("State must be a string")
       .notEmpty()
       .withMessage("State is required!"),
    body('pincode')
       .isString()
       .withMessage("Pincode must be a string")
       .notEmpty()
       .withMessage("Pincode is required!"),
    body('country')
       .isString()
       .withMessage("Country must be a string")
       .notEmpty()
       .withMessage("Country is required!"),
    body('isDefault')
       .optional()
       .isBoolean()
       .withMessage("isDefault must be a boolean!"),
    respondWithValidationErrors
]

module.exports = {
    registerUserValidations,
    loginUserValidations,
    addUserAddressValidatoins
}
