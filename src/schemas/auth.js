import * as yup from 'yup';

const signupbody = yup.object().shape({
  email: yup.string().email().required("Email address is required"),
  password: yup.string().required(),
});

export const signupbodySchema = yup.object({
  body: signupbody,
});
