import { useState } from "react";

export function useSubmitForm({ url, method = "POST", beforeSubmit, onSuccess = () => {} }) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);

  async function handleSubmit(e) {
    e.preventDefault();
    beforeSubmit();

    const form = e.target;
    let formData = new FormData(form);
    formData = Object.fromEntries(formData.entries()); // Convert FormData to a plain object

    // Convert points to a number
    formData.points = Number(formData.points);

    // Confirm before submitting
    const isConfirmed = window.confirm(`You are sending ${formData.points} points to ${formData.beneficiary} `);
    if (!isConfirmed) {
      return;
    }

    console.log("Form Data", formData);

    const API = "https://api.growthspringers.com/transfer-points";

    async function submit() {
      setIsLoading(true);
      setError(null);
      setData(null);

      try {
        const res = await fetch(API, {
          method: method,
          headers: {
            "Content-Type": "application/json",  // Ensures JSON is sent
          },
          body: JSON.stringify(formData),
          credentials: "include"
        });

        const data = await res.json();
        if (res.ok) {
          onSuccess(data, formData);
          setData(data);
        } else {
          setData(null);
          setError(new Error(data.message || "Something went wrong"));
        }
      } catch (err) {
        setError(err);
        setData(null);
      }
      setIsLoading(false);
    }

    submit();
  }

  return { isLoading, data, error, setIsLoading, setData, setError, handleSubmit };
}
