import { useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { verifyAccountToken } from '../features/servicenow/account/accountSlice';
import { Box, CircularProgress } from '@mui/material';

const VerifyToken = ({ children }) => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { loading, error, verifiedAccount } = useSelector(state => state.account);
  const token = searchParams.get('token');

  useEffect(() => {
    if (token) {
      dispatch(verifyAccountToken(token));
    } else {
      navigate('/verification-error', { state: { error: 'Missing token' } });
    }
  }, [token, dispatch, navigate]);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" mt={4}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    navigate('/verification-error', { state: { error } });
    return null;
  }

  if (verifiedAccount) {
    return children;
  }

  return null;
};

export default VerifyToken;