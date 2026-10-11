import React from "react";
import { useNavigate } from "react-router-dom";
import VisibilityIcon from "@mui/icons-material/Visibility";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";

const ActionButtons = ({
  item,
  onView,
  onEdit,
  onDelete,
  editPath = null
}) => {
  const navigate = useNavigate();

  const handleEdit = () => {
    if (editPath) {
      navigate(editPath);
    } else if (onEdit) {
      onEdit(item);
    }
  };

  return (
    <div className="flex space-x-1.5">
      {/* View Button */}
      {onView && (
<button
  title="View"
  onClick={() => onView(item)}
  style={{
    width: 32,
    height: 32,
    borderRadius: 4,
    border: '1px solid #574fdd',
    backgroundColor: 'transparent',
    color: '#574fdd',
    cursor: 'pointer',
    transition: 'background-color 0.2s ease',
  }}
  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#ecebff')}
  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
>
  <VisibilityIcon fontSize="small" />
</button>


      )}

      {/* Edit Button */}
      {(onEdit || editPath) && (
       <button
  title="Edit"
  onClick={handleEdit}
  style={{
    width: 32,
    height: 32,
    borderRadius: 4,
    border: '1px solid #574fdd',
    backgroundColor: 'transparent',
    color: '#574fdd',
    cursor: 'pointer',
    transition: 'background-color 0.2s ease',
  }}
  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#ecebff')}
  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
>
  <EditIcon fontSize="small" />
</button>

      )}

      {/* Delete Button */}
      {onDelete && (
       <button
  title="Delete"
  onClick={() => onDelete(item)}
  style={{
    width: 32,
    height: 32,
    borderRadius: 4,
    border: '1px solid #574fdd',
    backgroundColor: 'transparent',
    color: '#574fdd',
    cursor: 'pointer',
    transition: 'background-color 0.2s ease',
  }}
  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#ecebff')}
  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
>
  <DeleteIcon fontSize="small" />
</button>

      )}
    </div>
  );
};

export default ActionButtons;