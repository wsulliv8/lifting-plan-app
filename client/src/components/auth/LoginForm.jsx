import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import Button from "../common/Button";
import Input from "../common/Input";
import { login } from "../../services/auth";

const LoginForm = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await login(email, password);
      navigate("/plans");
    } catch (err) {
      setError(err.response?.data?.error || "Login failed");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="form-card">
      <h2 className="heading mb-6 text-center">Login</h2>
      <Input
        label="Email"
        type="email"
        value={email}
        required={true}
        onChange={(e) => setEmail(e.target.value)}
      />
      <Input
        label="Password"
        type="password"
        value={password}
        required={true}
        onChange={(e) => setPassword(e.target.value)}
      />
      {error && <p className="error-text">{error}</p>}
      <Button type="submit">Login</Button>
      <p className="mt-4 text-center text-gray-600">
        No account?{" "}
        <Link to="/register" className="text-blue-500 hover:underline">
          Register
        </Link>
      </p>
    </form>
  );
};

export default LoginForm;
