import React from "react";
import Field from "./Field";

export default function TextField({ label, value, onChange, hint, placeholder }) {
  return (
    <Field label={label} hint={hint}>
      <input type="text" value={value} placeholder={placeholder} onChange={(event) => onChange(event.target.value)} />
    </Field>
  );
}
