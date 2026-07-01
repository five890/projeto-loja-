import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle } from "lucide-react";
import { Link } from "wouter";

export default function OrderConfirmation() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <CheckCircle className="w-16 h-16 text-green-600" />
          </div>
          <CardTitle className="text-2xl">Obrigado pela compra!</CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-6">
          <div className="bg-blue-50 p-4 rounded-lg">
            <p className="text-lg font-semibold text-gray-800">
              Seu comprovante está sendo analisado e em breve sairá para entrega
            </p>
          </div>

          <div className="space-y-3">
            <p className="text-gray-600">
              Você receberá um email com atualizações sobre seu pedido.
            </p>
            <p className="text-sm text-gray-500">
              Tempo estimado de análise: 1-2 horas
            </p>
          </div>

          <Link href="/cart">
            <Button className="w-full bg-purple-600 hover:bg-purple-700">
              Ir para o carrinho
            </Button>
          </Link>

          <Link href="/">
            <Button variant="outline" className="w-full">
              Continuar Comprando
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
