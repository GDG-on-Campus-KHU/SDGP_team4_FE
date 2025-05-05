import React, { ReactNode } from 'react';
import styled from '@emotion/styled';
import { Dialog, DialogContent, DialogActions, Button, IconButton } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';

interface CustomDialogProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  confirmButtonText?: string;
  cancelButtonText?: string;
  onConfirm?: () => void;
  showCancelButton?: boolean;
  maxWidth?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
}

const CustomDialog = ({
  open,
  onClose,
  title,
  children,
  confirmButtonText = '확인',
  cancelButtonText = '취소',
  onConfirm,
  showCancelButton = false,
  maxWidth = 'sm',
}: CustomDialogProps) => {
  const handleConfirm = () => {
    if (onConfirm) {
      onConfirm();
    } else {
      onClose();
    }
  };

  return (
    <StyledDialog
      open={open}
      onClose={onClose}
      maxWidth={maxWidth}
      fullWidth
    >
      <DialogHeader>
        <DialogTitle></DialogTitle>
        <IconButton onClick={onClose} size="small">
          <CloseIcon sx={{ color: 'white' }} />
        </IconButton>
      </DialogHeader>
      <DialogContent sx={{ padding: '24px' }}>
        {children}
      </DialogContent>
      <StyledDialogActions>
        {showCancelButton && (
          <CancelButton onClick={onClose} variant="outlined">
            {cancelButtonText}
          </CancelButton>
        )}
        <ConfirmButton onClick={handleConfirm} variant="contained">
          {confirmButtonText}
        </ConfirmButton>
      </StyledDialogActions>
    </StyledDialog>
  );
};

const StyledDialog = styled(Dialog)`
  .MuiDialog-paper {
    width: 400px;
    border-radius: 10px;
    overflow: hidden;
  }
`;

const DialogHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  background-color: #D2E0FB;
  padding: 4px 8px;
`;

const DialogTitle = styled.h2`
  margin: 0;
  font-size: 18px;
  color: #333;
`;

const StyledDialogActions = styled(DialogActions)`
  padding: 16px 24px;
  justify-content: flex-end;
`;

const ConfirmButton = styled(Button)`
 
`;

const CancelButton = styled(Button)`

`;

export default CustomDialog; 