import { SignUp } from '@clerk/nextjs';

export default function SignUpPage() {
  return (
    <div className="flex h-screen items-center justify-center bg-gray-50">
      <SignUp />
    </div>
  );
}
