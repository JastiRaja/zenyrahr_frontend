import * as React from 'react';
import { useState, useEffect } from 'react';
import { DataGrid } from '@mui/x-data-grid';
import Paper from '@mui/material/Paper';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import TextField from '@mui/material/TextField';
import axios from 'axios';
import { toast, ToastContainer } from 'react-toastify';
import CommonDialog from './components/CommonDialog';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL_LOCAL;
const columns = [
  { field: 'id', headerName: 'ID', width: 50 },
  { field: 'firstName', headerName: 'First name', width: 100 },
  { field: 'middleName', headerName: 'Middle Name', width: 100 },
  { field: 'lastName', headerName: 'Last name', width: 100 },
  { field: 'age', headerName: 'Age', type: 'number', width: 40 },
  {
    field: 'fullName',
    headerName: 'Full name',
    sortable: false,
    width: 120,
    valueGetter: (params) => {
      const row = params?.row || {};
      return `${row.firstName || ''} ${row.lastName || ''}`;
    },
  },
  { field: 'mobile', headerName: 'Mobile', width: 129, sortable: false },
  { field: 'emailId', headerName: 'Email ID', width: 150, sortable: false },
  { field: 'aadhaar', headerName: 'Aadhaar No', width: 140, sortable: false },
];

const paginationModel = { page: 0, pageSize: 5 };

export default function Emptable() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRow, setSelectedRow] = useState(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedRows, setSelectedRows] = useState([]);
  const [messageDialog, setMessageDialog] = useState({
    isOpen: false,
    title: '',
    message: '',
    tone: 'default',
  });

  useEffect(() => {
    axios
      .get(`${API_BASE_URL}/api/employeeinfo`)
      .then((response) => {
        setRows(response.data);
        setLoading(false);
      })
      .catch((error) => {
        console.error('Error fetching data:', error);
        setLoading(false);
      });
  }, []);

  const handleRowSelection = (newSelection) => {
    if (newSelection.length === 1) {
      const selectedRow = rows.find((row) => row.id === newSelection[0]);
      setSelectedRow(selectedRow);
      setIsDialogOpen(true);
    } else {
      setIsDialogOpen(false); // Close dialog if multiple or no rows are selected
    }
    setSelectedRows(newSelection); // Track selected rows
  };

  const handleDialogClose = () => {
    setIsDialogOpen(false);
    setSelectedRow(null);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setSelectedRow({ ...selectedRow, [name]: value });
  };

  const handleSave = () => {
    if (selectedRow) {
      // console.log('Selected Row to Save:', selectedRow); // Debugging

      // Prepare the updated row object
      const updatedRow = { ...selectedRow };

      axios
        .put(`${API_BASE_URL}/api/employeeinfo/${selectedRow.id}`, updatedRow)
        .then((response) => {
          // console.log('Update Response:', response); // Debugging

          // Update the state to reflect changes
          setRows((prevRows) =>
            prevRows.map((row) =>
              row.id === selectedRow.id ? updatedRow : row
            )
          );
          handleDialogClose(); // Close the dialog

          // Show success toast
          toast.success(`Details updated for ${selectedRow.firstName} ${selectedRow.lastName}`);
        })

        .catch((error) => {
          console.error('Error updating data:', error);
          setMessageDialog({
            isOpen: true,
            title: 'Update Failed',
            message: 'Failed to save the changes. Please try again.',
            tone: 'error',
          });
        });
    } else {
      console.error('No row selected to save.');
    }
  };


  return (
    <Paper sx={{ height: 550, width: '100%' }}>
      <DataGrid
        rows={rows}
        columns={columns}
        loading={loading}
        initialState={{ pagination: { paginationModel } }}
        pageSizeOptions={[5, 10]}
        checkboxSelection
        onRowSelectionModelChange={handleRowSelection}
        sx={{ border: 0 }}
      />

      <Dialog open={isDialogOpen} onClose={handleDialogClose}>
        <DialogTitle>Edit Employee</DialogTitle>
        <DialogContent>
          {selectedRow && (
            <>
              <TextField
                margin="dense"
                name="firstName"
                label="First Name"
                type="text"
                fullWidth
                value={selectedRow.firstName || ''}
                onChange={handleInputChange}
              />
              <TextField
                margin="dense"
                name="middleName"
                label="Middle Name"
                type="text"
                fullWidth
                value={selectedRow.middleName || ''}
                onChange={handleInputChange}
              />
              <TextField
                margin="dense"
                name="lastName"
                label="Last Name"
                type="text"
                fullWidth
                value={selectedRow.lastName || ''}
                onChange={handleInputChange}
              />
              <TextField
                margin="dense"
                name="age"
                label="Age"
                type="number"
                fullWidth
                value={selectedRow.age || ''}
                onChange={handleInputChange}
              />
              <TextField
                margin="dense"
                name="mobile"
                label="Mobile"
                type="text"
                fullWidth
                value={selectedRow.mobile || ''}
                onChange={handleInputChange}
              />
              <TextField
                margin="dense"
                name="emailId"
                label="Email ID"
                type="email"
                fullWidth
                value={selectedRow.emailId || ''}
                onChange={handleInputChange}
              />
              <TextField
                margin="dense"
                name="aadhaar"
                label="Aadhaar No"
                type="text"
                fullWidth
                value={selectedRow.aadhaar || ''}
                onChange={handleInputChange}
              />
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDialogClose}>Cancel</Button>
          <Button onClick={handleSave} color="primary">
            Save
          </Button>
        </DialogActions>
      </Dialog>
      <CommonDialog
        isOpen={messageDialog.isOpen}
        title={messageDialog.title}
        message={messageDialog.message}
        tone={messageDialog.tone}
        confirmText="OK"
        hideCancel
        onClose={() =>
          setMessageDialog({
            isOpen: false,
            title: '',
            message: '',
            tone: 'default',
          })
        }
      />
      <center><ToastContainer /></center>
    </Paper>

  );
}
