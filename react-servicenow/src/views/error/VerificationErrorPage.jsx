
const VerificationErrorPage = () => {

  return (
    <div className="bg-white text-gray-900 font-sans container mx-auto px-6 py-8 max-w-lg">
    <h1 className="text-red-600 text-2xl font-bold mb-4">Oops! An Error Occurred</h1>
    <h2 className="text-lg font-semibold mb-4">you can't access this link, Token problem.</h2>
    <p className="text-base">
      Something is broken. Please contact your commercial agent
    </p>
  </div>
  );
};

export default VerificationErrorPage;
