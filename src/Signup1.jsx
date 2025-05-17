import React, { useState } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import FormControl from '@mui/material/FormControl';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import Stack from '@mui/material/Stack';
import MuiCard from '@mui/material/Card';
import { styled } from '@mui/material/styles';
import AppTheme from './shared-theme/AppTheme';
import { InputAdornment, Select, MenuItem } from '@mui/material';
import { TfiEmail } from 'react-icons/tfi';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL_LOCAL;
const Card = styled(MuiCard)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  alignSelf: 'center',
  width: '100%',
  padding: theme.spacing(4),
  border: '1px solid white',
  backdropFilter: 'blur(30px)',
  boxShadow:
    'hsla(220, 30%, 5%, 0.05) 0px 5px 15px 0px, hsla(220, 25%, 10%, 0.05) 0px 15px 35px -5px',
  [theme.breakpoints.up('sm')]: {
    width: '80%',
    maxWidth: '250px',
  },
  borderRadius: '20px',
}));

const SignUpContainer = styled('div')(({ theme }) => ({
  height: '100vh',
  alignContent: 'center',
}));

const FormContainer = styled(Stack)(({ theme }) => ({
  flexBasis: '50%',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  padding: theme.spacing(4),
}));

export default function SignUp(props) {
  const [formValues, setFormValues] = useState({
    firstname: '',
    lastname: '',
    email: '',
    role: '',
  });

  const [errors, setErrors] = useState({
    emailError: '',
    nameError: '',
    roleError: '',
  });

  const handleChange = (e) => {
    setFormValues({
      ...formValues,
      [e.target.name]: e.target.value,
    });
  };

  const validateInputs = () => {
    const newErrors = { emailError: '', nameError: '', roleError: '' };
    let isValid = true;

    if (!formValues.email || !/\S+@\S+\.\S+/.test(formValues.email)) {
      newErrors.emailError = 'Please enter a valid email address.';
      isValid = false;
    }

    if (!formValues.firstname || formValues.firstname.length < 1) {
      newErrors.nameError = 'First Name is required.';
      isValid = false;
    }

    if (!formValues.role || formValues.role.length < 1) {
      newErrors.roleError = 'Role is required.';
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!validateInputs()) {
      return;
    }

    const data = {
      firstname: formValues.firstname,
      lastname: formValues.lastname,
      username: formValues.email,
      role: formValues.role,
    };

    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        if (response.status === 409) {
          // If status code 409 (Conflict), show user exists error
          toast.error('User already exists!');
        } else {
          console.error('Error:', errorData);
        }
        return;
      }

      const responseData = await response.json();
      // console.log('Success:', responseData);

      setFormValues({
        firstname: '',
        lastname: '',
        email: '',
        role: '',
      });

      toast.success('User Registration Successful!');
    } catch (error) {
      console.error('Error:', error);
      toast.error('An error occurred during registration.');
    }
  };

  return (
    <AppTheme {...props}>
      <SignUpContainer className="container3">
        <FormContainer>
          <Card variant="outlined" sx={{ backgroundColor: 'transparent', boxShadow: 'none' }}>
            <Typography
              component="h1"
              variant="h4"
              sx={{ fontSize: 'clamp(2rem, 10vw, 2.15rem)', color: 'white' }}
            >
              Register
            </Typography>
            <Box
              component="form"
              onSubmit={handleSubmit}
              sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}
            >
              <FormControl fullWidth>
                <TextField
                  required
                  placeholder="First Name"
                  name="firstname"
                  value={formValues.firstname}
                  onChange={handleChange}
                  error={Boolean(errors.nameError)}
                  helperText={errors.nameError}
                />
              </FormControl>

              <FormControl fullWidth>
                <TextField
                  required
                  placeholder="Last Name"
                  name="lastname"
                  value={formValues.lastname}
                  onChange={handleChange}
                  error={Boolean(errors.nameError)}
                  helperText={errors.nameError}
                />
              </FormControl>

              <FormControl fullWidth>
                <TextField
                  required
                  placeholder="example@xyz.com"
                  name="email"
                  value={formValues.email}
                  onChange={handleChange}
                  error={Boolean(errors.emailError)}
                  helperText={errors.emailError}
                  slotProps={{
                    input: {
                      endAdornment: (
                        <InputAdornment position="end">
                          <TfiEmail />
                        </InputAdornment>
                      ),
                    },
                  }}
                />
              </FormControl>

              <FormControl fullWidth error={Boolean(errors.roleError)}>
                <Select
                  value={formValues.role}
                  onChange={handleChange}
                  displayEmpty
                  name="role"
                  inputProps={{ 'aria-label': 'Select Role' }}
                >
                  <MenuItem value="">
                    <em>Select Role</em>
                  </MenuItem>
                  <MenuItem value="Manager">Manager</MenuItem>
                  <MenuItem value="HR">HR</MenuItem>
                  <MenuItem value="Senior Consultant">Senior Consultant</MenuItem>
                  <MenuItem value="Trainee">Trainee</MenuItem>
                </Select>
                {errors.roleError && (
                  <Typography color="error">{errors.roleError}</Typography>
                )}
              </FormControl>

              <Button type="submit" fullWidth variant="contained">
                Register
              </Button>
            </Box>
          </Card>
        </FormContainer>
        <ToastContainer />
      </SignUpContainer>
    </AppTheme>
  );
}
