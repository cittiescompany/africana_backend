const yup = require('yup');

const signupbody = yup.object().shape({
  email: yup.string().email().required("Email address is required"),
  password: yup.string().required(),
});

const signupbodySchema = yup.object({
  body: signupbody,
});
const verifybody = yup.object().shape({
  email: yup.string().email().required("Email address is required"),
  code: yup.string().required(),
  type: yup.string().required(),
});
const verifybodySchema = yup.object({
  body: verifybody ,
});
const resendbody = yup.object().shape({
  email: yup.string().email().required("Email address is required"),
  type: yup.string().required(),
});

const resendMailbodySchema = yup.object({
  body: resendbody  ,
});

module.exports = { signupbodySchema,verifybodySchema,resendMailbodySchema  };
