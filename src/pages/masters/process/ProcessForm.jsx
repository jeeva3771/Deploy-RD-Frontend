import React from "react";
import { FormControl, Select, MenuItem, Autocomplete, TextField } from "@mui/material";

const ProcessForm = ({
	formData,
	setFormData,
	errors,
	isSubmitting,
	rateUnits,
	departments,
	onInputChange,
	onSubmit,
	processId,
	handleAddBed,
	handleBedChange,
	removeBed,
}) => {
	return (
		<form
			onSubmit={onSubmit}
			className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6"
		>
			<div className="grid grid-cols-1 md:grid-cols-4 gap-4">
				{/* NAME */}
				<div>
					<label className="block text-sm font-medium text-gray-700 mb-1">
						Process Name <span className="text-red-500">*</span>
					</label>
					<input
						type="text"
						name="name"
						value={formData.name ?? ""}
						onChange={onInputChange}
						placeholder="Enter process name"
						className="w-full border px-3 py-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
					/>
					{errors.name && (
						<span className="text-red-500 text-xs mt-1">{errors.name}</span>
					)}
				</div>

				{/* RATE */}
				<div>
					<label className="block text-sm font-medium text-gray-700 mb-1">
						Rate <span className="text-red-500">*</span>
					</label>
					<input
						type="number"
						name="rate"
						value={formData.rate ?? ""}
						onChange={onInputChange}
						placeholder="Enter rate"
						className="w-full border px-3 py-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
					/>
					{errors.rate && (
						<span className="text-red-500 text-xs mt-1">{errors.rate}</span>
					)}
				</div>

				{/* MIN RATE 1 */}
				<div>
					<label className="block text-sm font-medium text-gray-700 mb-1">
						Min Rate #1 (For Qty upto 25) <span className="text-red-500">*</span>
					</label>
					<input
						type="number"
						name="min_rate_slab_1"
						value={formData.min_rate_slab_1 ?? ""}
						onChange={onInputChange}
						placeholder="Enter min rate #1"
						className="w-full border px-3 py-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
					/>
					{errors.min_rate_slab_1 && (
						<span className="text-red-500 text-xs mt-1">{errors.min_rate_slab_1}</span>
					)}
				</div>

				{/* MIN RATE 2 */}
				<div>
					<label className="block text-sm font-medium text-gray-700 mb-1">
						Min Rate #2 (For Qty upto 5) <span className="text-red-500">*</span>
					</label>
					<input
						type="number"
						name="min_rate_slab_2"
						value={formData.min_rate_slab_2 ?? ""}
						onChange={onInputChange}
						placeholder="Enter min rate #2"
						className="w-full border px-3 py-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
					/>
					{errors.min_rate_slab_2 && (
						<span className="text-red-500 text-xs mt-1">{errors.min_rate_slab_2}</span>
					)}
				</div>

				{/* RATE UNIT */}
				<div>
					<label className="block text-sm font-medium text-gray-700 mb-1">
						Rate Unit <span className="text-red-500">*</span>
					</label>
					<Select
						name="unit"
						value={formData.unit ?? ""}
						onChange={onInputChange}
						displayEmpty
						size="small"
						fullWidth
						renderValue={(selected) => {
							if (!selected) return <span className="text-[var(--theme-text-muted)]">Select rate unit</span>;
							const selectedUnit = rateUnits?.find((ru) => ru._id === selected);
							return selectedUnit ? `${selectedUnit.name}${selectedUnit.symbol ? ` (${selectedUnit.symbol})` : ""}` : selected;
						}}
					>
						<MenuItem value="">
							<span className="text-[var(--theme-text-muted)]">Select rate unit</span>
						</MenuItem>
						{rateUnits?.length > 0 ? (
							rateUnits.map((ru) => (
								<MenuItem key={ru._id} value={ru._id}>
									{ru.name}{ru.symbol ? ` (${ru.symbol})` : ""}
								</MenuItem>
							))
						) : (
							<MenuItem disabled>No rate units found</MenuItem>
						)}
					</Select>
					{errors.unit && <p className="text-red-600 text-sm mt-1">{errors.unit}</p>}
				</div>

				{/* DEPARTMENT */}
				<div>
					<label className="block text-sm font-medium text-gray-700 mb-1">Department (Text)</label>
					<input
						type="text"
						name="department"
						value={formData.department ?? ""}
						onChange={onInputChange}
						placeholder="Enter department"
						className="w-full border px-3 py-2 rounded-lg"
					/>
					{errors.department && <p className="text-red-600 text-sm mt-1">{errors.department}</p>}
				</div>

				{/* LINKED DEPARTMENT (MASTER) */}
				<div>
					<label className="block text-sm font-medium text-gray-700 mb-1">
						Linked Department (Master) <span className="text-red-500">*</span>
					</label>
					<Autocomplete
						options={departments || []}
						getOptionLabel={(option) => option.name || ""}
						value={departments?.find((d) => (d._id || d.id) === formData.linked_department) || null}
						onChange={(event, newValue) => {
							onInputChange({
								target: {
									name: "linked_department",
									value: newValue ? (newValue._id || newValue.id) : "",
								},
							});
						}}
						size="small"
						fullWidth
						renderInput={(params) => (
							<TextField
								{...params}
								placeholder="Select linked department..."
								error={!!errors.linked_department}
							/>
						)}
						isOptionEqualToValue={(option, value) => (option._id || option.id) === (value._id || value.id)}
					/>
					{errors.linked_department && <p className="text-red-600 text-sm mt-1">{errors.linked_department}</p>}
				</div>

				{/* PROMPT */}
				<div>
					<label className="block text-sm font-medium text-gray-700 mb-1">Prompt</label>
					<input
						type="text"
						name="prompt"
						value={formData.prompt ?? ""}
						onChange={onInputChange}
						placeholder="Enter a prompt"
						className="w-full border px-3 py-2 rounded-lg"
					/>
				</div>

				{/* TYPE */}
				<div>
					<FormControl fullWidth size="small">
						<label className="block text-sm font-semibold text-gray-700 mb-2">
							Type <span className="text-red-600">*</span>
						</label>
						<Select
							name="type"
							value={formData.type ?? ""}
							onChange={onInputChange}
							displayEmpty
							size="small"
							renderValue={(selected) => selected || <span className="text-[var(--theme-text-muted)]">Select type</span>}
						>
							<MenuItem value="" disabled>Select type</MenuItem>
							<MenuItem value="job_absolute_area">Job Absolute Area</MenuItem>
							<MenuItem value="sheet_time_based">Sheet Time Based</MenuItem>
							<MenuItem value="sheet_rate_based">Sheet Rate Based</MenuItem>
							<MenuItem value="standard_unit">Standard Unit</MenuItem>
							<MenuItem value="ups_based">Ups Based</MenuItem>
						</Select>
						{errors.type && <p className="text-red-600 text-sm mt-1">{errors.type}</p>}
					</FormControl>
				</div>

				{/* STATUS */}
				<div>
					<FormControl fullWidth size="small">
						<label className="block text-sm font-semibold text-gray-700 mb-2">Status</label>
						<Select
							name="is_active"
							value={String(formData.is_active)}
							onChange={(e) =>
								onInputChange({ target: { name: "is_active", value: e.target.value === "true" } })
							}
							displayEmpty
						>
							<MenuItem value="true">Active</MenuItem>
							<MenuItem value="false">Inactive</MenuItem>
						</Select>
					</FormControl>
				</div>
				<div className="flex items-center gap-2 mt-2">
					<input
						type="checkbox"
						checked={formData.is_uv ?? false}
						onChange={(e) =>
							setFormData((prev) => ({
								...prev,
								is_uv: e.target.checked,
								beds: e.target.checked ? prev.beds : [],
								mov: e.target.checked ? prev.mov : ""
							}))
						}
						className="w-4 h-4"
					/>
					<label className="text-sm font-medium text-gray-700">
						Is UV Process
					</label>
				</div>

				{formData.is_uv && (
					<div>
						<label className="block text-sm font-medium text-gray-700 mb-1">
							MOV <span className="text-red-500">*</span>
						</label>
						<input
							type="number"
							name="mov"
							value={formData.mov ?? ""}
							onChange={(e) =>
								setFormData((prev) => ({ ...prev, mov: e.target.value }))
							}
							placeholder="Enter MOV"
							className="w-full border px-3 py-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
						/>
					</div>
				)}


			</div>

			{formData.is_uv && (
				<div className="mt-2">
					<label
						className="block text-sm font-semibold text-gray-700 mb-2"
					>
						Bed Configuration <span className="text-red-600">*</span>
					</label>

					{formData.beds && formData.beds.length > 0 && formData.beds.map((bed, index) => (
						<div
							key={index}
							className="grid grid-cols-2 md:grid-cols-[1fr_1fr_1fr_1fr_1fr_auto] gap-2 mb-2 items-end border border-gray-200 p-2 rounded-lg w-full"
						>
							<input
								type="number"
								placeholder="Width"
								value={bed.width ?? ""}
								onChange={(e) => handleBedChange(index, "width", e.target.value)}
								className="border px-2 py-1 text-sm h-9 rounded-md w-full"
							/>

							<input
								type="number"
								placeholder="Height"
								value={bed.height ?? ""}
								onChange={(e) => handleBedChange(index, "height", e.target.value)}
								className="border px-2 py-1 text-sm h-9 rounded-md w-full"
							/>

							<input
								type="number"
								placeholder="Sq Inch"
								value={bed.bed_area ?? ""}
								readOnly
								className="border px-2 py-1 text-sm h-9 rounded-md bg-gray-100 w-full"
							/>

							<input
								type="number"
								placeholder="Rate / SqIn"
								value={bed.rate ?? ""}
								onChange={(e) => handleBedChange(index, "rate", e.target.value)}
								className="border px-2 py-1 text-sm h-9 rounded-md w-full"
							/>

							<input
								type="number"
								placeholder="Total"
								value={Number(bed.min_cycle_cost ?? 0).toFixed(2)}
								readOnly
								className="border px-2 py-1 text-sm h-9 rounded-md bg-gray-100 w-full"
							/>
							<button
								onClick={() => removeBed(index)}
								className="text-red-500 text-lg flex items-center justify-center px-2"
							>
								&times;
							</button>
						</div>

					))}

					<button
						type="button"
						onClick={handleAddBed}
						className="mt-2 px-3 py-1.5 text-sm bg-green-600 text-white rounded-md hover:bg-green-700"
					>
						+ Add Bed
					</button>
				</div>
			)}

			{/* BUTTON */}
			<div className="flex justify-end gap-3 mt-6 border-t border-gray-200 pt-4">
				<button
					type="submit"
					disabled={isSubmitting}
					style={{ backgroundColor: "#574fdd" }}
					className={`px-6 py-2.5 rounded-lg text-white transition-colors duration-300 ease-in-out ${isSubmitting ? "opacity-70 cursor-not-allowed" : "cursor-pointer"
						}`}
				>
					{isSubmitting ? "Saving..." : processId ? "Update" : "Add"}
				</button>
			</div>
		</form>
	);
};

export default ProcessForm;
