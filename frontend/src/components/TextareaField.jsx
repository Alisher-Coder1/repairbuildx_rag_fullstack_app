import React from "react";
import Field from "./Field";

export default function TextareaField({ label, value, onChange, hint, placeholder, rows = 3 }) {
  return (
    <Field label={label} hint={hint}>
      <textarea
        rows={rows}
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
      />
    </Field>
  );
}
