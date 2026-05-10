import React from "react";
import Field from "./Field";

export default function NumberField({ label, value, onChange, hint, min = "0", step = "0.01" }) {
  return (
    <Field label={label} hint={hint}>
      <input type="number" min={min} step={step} value={value} onChange={(event) => onChange(event.target.value)} />
    </Field>
  );
}
