import React from "react";
import Field from "./Field";
import { getUiLabel } from "../utils/helpers";

export default function SelectField({ label, value, onChange, options, hint, disabled = false }) {
  return (
    <Field label={label} hint={hint}>
      <select value={value} onChange={(event) => onChange(event.target.value)} disabled={disabled}>
        {options.map((option) => (
          <option key={option} value={option}>
            {getUiLabel(option)}
          </option>
        ))}
      </select>
    </Field>
  );
}
