import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import CloseIcon from "@mui/icons-material/Close";
import Button from "@mui/material/Button";
import { FormControl, MenuItem, Select } from "@mui/material";
import { toast } from "react-toastify";
import { fetchproductionTeam, updateSampleOrderById } from "../../../reducer/sampleSalesorderReducer";

const AssignProductionModal = ({ open, onClose, sampleOrderId, onAssignSuccess }) => {
  const dispatch = useDispatch();
  const { Productionteammembers } = useSelector(state => state.sampleSalesOrders);
  const [selectedMember, setSelectedMember] = useState("");

  useEffect(() => {
    if (open) {
      dispatch(fetchproductionTeam());
    }
  }, [dispatch, open]);

  const handleChange = (event) => {
    setSelectedMember(event.target.value);
  };

  const handleAssign = async () => {
    if (!selectedMember) {
      toast.error("Please select a member to assign.");
      return;
    }

    try {
      const formData = new FormData();
      formData.append("production_team_person", selectedMember);

      const resultAction = await dispatch(
        updateSampleOrderById({ id: sampleOrderId, formData })
      );

      if (updateSampleOrderById.fulfilled.match(resultAction)) {
        toast.success("Production member assigned successfully!");
        if (onAssignSuccess) onAssignSuccess();
        onClose();
      } else {
        toast.error(resultAction.payload || "Failed to assign production member.");
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to assign production member.");
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="relative bg-white p-6 rounded-xl shadow-2xl w-[400px]">

        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-500 hover:text-black"
        >
          <CloseIcon style={{ fontSize: 26 }} />
        </button>

        <h2 className="text-xl font-semibold mb-4">Assign Production Member</h2>

        <FormControl fullWidth variant="outlined" size="small">
          <Select value={selectedMember} onChange={handleChange} displayEmpty>
            <MenuItem value="" disabled>
              Select Member
            </MenuItem>

            {Productionteammembers?.length > 0 ? (
              Productionteammembers.map((member) => (
                <MenuItem key={member.id} value={member._id}>
                  {member.name}
                </MenuItem>
              ))
            ) : (
              <MenuItem value="" disabled>
                No members available
              </MenuItem>
            )}
          </Select>
        </FormControl>

        <div className="flex justify-end gap-2 mt-4">
          <Button variant="outlined" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="contained" onClick={handleAssign} color="primary">
            Assign
          </Button>
        </div>
      </div>
    </div>
  );
};

export default AssignProductionModal;
