
import React, { useState, useEffect } from "react";
import PropTypes from "prop-types";
import { cn } from "@/lib/utils"; // optional helper for classnames (or just use string)

export function Command({ children, className, ...props }) {
  return (
    <div className={cn("bg-white border rounded-md p-2", className)} {...props}>
      {children}
    </div>
  );
}

export function CommandInput({ value, onChange, placeholder }) {
  return (
    <input
      type="text"
      className="w-full px-2 py-1 border-b focus:outline-none"
      placeholder={placeholder}
      value={value}
      onChange={onChange}
    />
  );
}

export function CommandList({ children }) {
  return <ul className="mt-2 max-h-60 overflow-auto">{children}</ul>;
}

export function CommandEmpty({ children }) {
  return (
    <div className="px-2 py-4 text-sm text-gray-500 text-center">
      {children}
    </div>
  );
}

CommandEmpty.propTypes = {
  children: PropTypes.node,
};

// Add inside src/components/ui/command.jsx

export function CommandGroup({ heading, children }) {
  return (
    <div className="py-1">
      {heading && (
        <div className="px-2 py-1 text-xs font-semibold text-gray-500 uppercase">
          {heading}
        </div>
      )}
      <div className="flex flex-col">{children}</div>
    </div>
  );
}

CommandGroup.propTypes = {
  heading: PropTypes.string,
  children: PropTypes.node,
};


export function CommandItem({ children, onSelect }) {
  return (
    <li
      tabIndex={0}
      onClick={onSelect}
      className="cursor-pointer px-2 py-1 rounded hover:bg-gray-100 focus:bg-gray-100 focus:outline-none"
    >
      {children}
    </li>
  );
}