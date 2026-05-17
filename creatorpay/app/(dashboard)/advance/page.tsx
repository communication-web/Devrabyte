import { Zap, Clock, CheckCircle } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'

export default function AdvancePage() {
  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Instant Advance</h1>
        <p className="text-gray-500 text-sm mt-0.5">Get paid upfront on your invoices</p>
      </div>

      <Card className="border-yellow-200">
        <CardContent className="py-8 text-center">
          <div className="inline-flex p-4 bg-yellow-50 rounded-2xl mb-4">
            <Zap className="h-8 w-8 text-yellow-500" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Coming Soon</h2>
          <p className="text-gray-500 max-w-sm mx-auto">
            Instant advances are currently in closed beta. You can request an advance directly from any sent invoice.
          </p>
        </CardContent>
      </Card>

      <div className="space-y-4">
        <h3 className="font-semibold text-gray-900">How it works</h3>
        {[
          { icon: Zap, title: 'Request on any sent invoice', desc: 'Open any invoice you\'ve sent and click "Get advance".' },
          { icon: Clock, title: 'We review within 24 hours', desc: 'Our team reviews your request and approves qualifying invoices.' },
          { icon: CheckCircle, title: 'Money hits your account', desc: 'You receive invoice total minus 2.5% fee, straight to your bank.' },
        ].map(({ icon: Icon, title, desc }) => (
          <div key={title} className="flex gap-4 p-4 bg-white rounded-xl border border-gray-200">
            <div className="p-2 bg-violet-50 rounded-lg h-fit">
              <Icon className="h-4 w-4 text-violet-600" />
            </div>
            <div>
              <p className="font-medium text-gray-900 text-sm">{title}</p>
              <p className="text-gray-500 text-sm mt-0.5">{desc}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
