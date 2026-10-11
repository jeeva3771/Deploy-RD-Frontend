import React, { useState } from "react";

const ProfileImage = ({
	src,
	alt,
	name,
	size = "default",
	shape = "circle",
}) => {
	const [imageError, setImageError] = useState(false);

	// Generate initials from name
	const getInitials = (name) => {
		if (!name) return "?";
		return name
			.split(" ")
			.map((word) => word.charAt(0))
			.join("")
			.toUpperCase()
			.slice(0, 2);
	};

	// Generate a consistent color based on name
	const getAvatarColor = (name) => {
		if (!name) return "bg-gray-400";
		const colors = [
			"bg-blue-500",
			"bg-green-500",
			"bg-purple-500",
			"bg-pink-500",
			"bg-indigo-500",
			"bg-yellow-500",
			"bg-red-500",
			"bg-gray-500",
		];
		const index = name.charCodeAt(0) % colors.length;
		return colors[index];
	};

	// Size configurations
	const sizeClasses = {
		default: "w-14 h-14 text-lg",
		large: "w-16 h-16 text-xl",
		modal: "w-24 h-24 text-2xl",
	};

	const currentSize = sizeClasses[size] || sizeClasses.default;
	const shapeClass = shape === "square" ? "rounded-lg" : "rounded-full";

	if (imageError || !src) {
		return (
			<div
				className={`${currentSize} ${shapeClass} flex items-center justify-center text-white font-medium ${getAvatarColor(
					name
				)}`}
			>
				{getInitials(name)}
			</div>
		);
	}

	return (
		<img
			src={src}
			alt={alt}
			className={`${currentSize} ${shapeClass} object-cover border-2 border-gray-200 hover:border-blue-300 transition-colors`}
			onError={() => setImageError(true)}
		/>
	);
};

export default ProfileImage;