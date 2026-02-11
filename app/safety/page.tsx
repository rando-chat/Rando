export default function SafetyPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <h1 className="text-4xl font-bold mb-6">Safety Guidelines</h1>
        
        <div className="bg-white rounded-lg p-8 space-y-6">
          <section>
            <h2 className="text-2xl font-bold mb-3">Stay Safe Online</h2>
            <ul className="space-y-2 text-gray-700">
              <li>• Never share personal information like your address, phone number, or email</li>
              <li>• Report any inappropriate behavior immediately</li>
              <li>• Don&apos;t share photos or videos</li>
              <li>• End the chat if you feel uncomfortable</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-3">Content Moderation</h2>
            <p className="text-gray-700">
              All messages are automatically scanned for inappropriate content. Messages that violate our guidelines will be blocked.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-3">Reporting</h2>
            <p className="text-gray-700">
              If someone violates our guidelines, please report them. Our team reviews all reports within 24 hours.
            </p>
          </section>
        </div>
      </div>
    </div>
  )
}
