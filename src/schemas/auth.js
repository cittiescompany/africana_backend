const yup = require('yup');

const signupbody = yup.object().shape({
  email: yup.string().email().required("Email address is required"),
  password: yup.string().required(),
});

const signupbodySchema = yup.object({
  body: signupbody,
});

module.exports = { signupbodySchema };
