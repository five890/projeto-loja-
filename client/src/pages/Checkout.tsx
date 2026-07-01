import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { ArrowLeft, Copy, Check } from "lucide-react";
import { useState } from "react";
import { useLocation } from "wouter";
import { toast } from "sonner";

const PIX_KEY = "4cd768c3-b51e-4ec5-b64b-f9ed40be6561";

export default function Checkout() {
  const [, setLocation] = useLocation();
  const [step, setStep] = useState(1);
  const [copied, setCopied] = useState(false);
  const [formData, setFormData] = useState({
    street: "",
    neighborhood: "",
    number: "",
    complement: "",
    complementType: "casa" as "casa" | "apartamento" | "condominio",
    contact: "",
  });
  const [proofFile, setProofFile] = useState<File | null>(null);

  const { data: cartItems } = trpc.cart.getItems.useQuery();
  const { mutate: createOrder, isPending } = trpc.orders.create.useMutation({
    onSuccess: (data) => {
      setLocation(`/order-confirmation/${data.orderId}`);
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao criar pedido");
    },
  });

  const total = cartItems?.reduce((sum, item) => {
    return sum + (Number(item.product?.price || 0) * item.quantity);
  }, 0) || 0;

  const handleCopyPix = () => {
    navigator.clipboard.writeText(PIX_KEY);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success("Chave PIX copiada!");
  };

  const handleSubmitDelivery = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.street || !formData.neighborhood || !formData.number || !formData.contact) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }
    setStep(2);
  };

  const handleSubmitPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!proofFile) {
      toast.error("Selecione o comprovante de pagamento");
      return;
    }

    // TODO: Upload do comprovante e criação do pedido
    const items = cartItems?.map((item) => ({
      productId: item.productId,
      quantity: item.quantity,
      price: item.product?.price || "0",
    })) || [];

    createOrder({
      ...formData,
      items,
      totalPrice: total.toString(),
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 py-8">
      <div className="max-w-2xl mx-auto px-4">
        <div className="flex items-center gap-4 mb-8">
          <Button
            variant="ghost"
            onClick={() => setLocation("/cart")}
            className="gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar
          </Button>
          <h1 className="text-3xl font-bold text-gray-800">Checkout</h1>
        </div>

        {/* Steps */}
        <div className="flex gap-4 mb-8">
          <div className={`flex-1 p-4 rounded-lg text-center font-semibold ${step >= 1 ? 'bg-purple-600 text-white' : 'bg-gray-200 text-gray-600'}`}>
            Entrega
          </div>
          <div className={`flex-1 p-4 rounded-lg text-center font-semibold ${step >= 2 ? 'bg-purple-600 text-white' : 'bg-gray-200 text-gray-600'}`}>
            Pagamento
          </div>
        </div>

        {step === 1 ? (
          <Card>
            <CardHeader>
              <CardTitle>Endereço de Entrega</CardTitle>
              <CardDescription>Preencha seus dados de entrega</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmitDelivery} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="street">Rua *</Label>
                    <Input
                      id="street"
                      value={formData.street}
                      onChange={(e) => setFormData({ ...formData, street: e.target.value })}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="neighborhood">Bairro *</Label>
                    <Input
                      id="neighborhood"
                      value={formData.neighborhood}
                      onChange={(e) => setFormData({ ...formData, neighborhood: e.target.value })}
                      className="mt-1"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="number">Número *</Label>
                    <Input
                      id="number"
                      value={formData.number}
                      onChange={(e) => setFormData({ ...formData, number: e.target.value })}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="complementType">Tipo de Imóvel</Label>
                    <Select value={formData.complementType} onValueChange={(value: any) => setFormData({ ...formData, complementType: value })}>
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="casa">Casa</SelectItem>
                        <SelectItem value="apartamento">Apartamento</SelectItem>
                        <SelectItem value="condominio">Condomínio</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="complement">Complemento (Apto, Bloco, etc)</Label>
                  <Input
                    id="complement"
                    value={formData.complement}
                    onChange={(e) => setFormData({ ...formData, complement: e.target.value })}
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="contact">Telefone/Contato *</Label>
                  <Input
                    id="contact"
                    value={formData.contact}
                    onChange={(e) => setFormData({ ...formData, contact: e.target.value })}
                    placeholder="(11) 99999-9999"
                    className="mt-1"
                  />
                </div>

                <Button type="submit" className="w-full bg-purple-600 hover:bg-purple-700">
                  Continuar para Pagamento
                </Button>
              </form>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {/* PIX Section */}
            <Card>
              <CardHeader>
                <CardTitle>Chave PIX</CardTitle>
                <CardDescription>Escaneie o código ou copie a chave abaixo</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-gray-100 p-6 rounded-lg text-center">
                  <p className="text-sm text-gray-600 mb-2">Chave PIX (CPF):</p>
                  <p className="text-lg font-mono font-bold text-gray-800 break-all">{PIX_KEY}</p>
                </div>
                <Button
                  onClick={handleCopyPix}
                  className="w-full gap-2"
                  variant="outline"
                >
                  {copied ? (
                    <>
                      <Check className="w-4 h-4" />
                      Copiado!
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      Copiar Chave PIX
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* Payment Proof */}
            <Card>
              <CardHeader>
                <CardTitle>Comprovante de Pagamento</CardTitle>
                <CardDescription>Envie a foto do comprovante do PIX</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmitPayment} className="space-y-4">
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => setProofFile(e.target.files?.[0] || null)}
                      className="hidden"
                      id="proof-upload"
                    />
                    <label htmlFor="proof-upload" className="cursor-pointer">
                      {proofFile ? (
                        <div>
                          <p className="font-semibold text-green-600">{proofFile.name}</p>
                          <p className="text-sm text-gray-600">Clique para alterar</p>
                        </div>
                      ) : (
                        <div>
                          <p className="font-semibold text-gray-700">Clique para enviar</p>
                          <p className="text-sm text-gray-600">ou arraste a imagem aqui</p>
                        </div>
                      )}
                    </label>
                  </div>

                  {/* Order Summary */}
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="font-semibold mb-2">Resumo do Pedido:</p>
                    <p className="text-sm text-gray-600">Rua: {formData.street}, {formData.number}</p>
                    <p className="text-sm text-gray-600">Bairro: {formData.neighborhood}</p>
                    <p className="text-sm text-gray-600">Contato: {formData.contact}</p>
                    <p className="font-bold text-lg mt-2 text-purple-600">
                      Total: R$ {total.toFixed(2)}
                    </p>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      className="flex-1"
                      onClick={() => setStep(1)}
                    >
                      Voltar
                    </Button>
                    <Button
                      type="submit"
                      className="flex-1 bg-purple-600 hover:bg-purple-700"
                      disabled={isPending || !proofFile}
                    >
                      {isPending ? "Processando..." : "Confirmar Pedido"}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
