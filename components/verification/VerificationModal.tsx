'use client'
export function VerificationModal({ onClose }: { onClose: () => void }) {
  return <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"><div className="bg-white rounded-lg p-6 max-w-md"><h2 className="text-xl font-bold mb-4">Verify Your Email</h2><button onClick={onClose} className="w-full bg-purple-600 text-white py-2 rounded-lg">Close</button></div></div>
}
