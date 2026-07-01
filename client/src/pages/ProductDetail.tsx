import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { trpc } from "@/lib/trpc";
import { ArrowLeft, Upload } from "lucide-react";
import { useState } from "react";
import { useLocation, useRoute } from "wouter";
import { toast } from "sonner";
import { useAuth } from "@/_core/hooks/useAuth";

export default function ProductDetail() {
  const [, setLocation] = useLocation();
  const [match, params] = useRoute("/product/:id");
  const productId = params?.id ? Number(params.id) : null;
  const { isAuthenticated } = useAuth();

  const [quantity, setQuantity] = useState(1);
  const [tryOnPhoto, setTryOnPhoto] = useState<File | null>(null);
  const [showTryOn, setShowTryOn] = useState(false);

  const { data: product } = trpc.products.getById.useQuery(productId || 0, {
    enabled: !!productId,
  });

  const { mutate: addToCart } = trpc.cart.addItem.useMutation({
    onSuccess: () => {
      toast.success("Produto adicionado ao carrinho!");
      setQuantity(1);
    },
  });

  const { mutate: createTryOn } = trpc.tryOn.create.useMutation({
    onSuccess: () => {
      toast.success("Foto enviada! Processando...");
      setTryOnPhoto(null);
    },
  });

  if (!match || !product) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando produto...</p>
        </div>
      </div>
    );
  }

  const handleAddToCart = () => {
    if (!isAuthenticated) {
      toast.error("Faça login para adicionar ao carrinho");
      setLocation("/login");
      return;
    }
    addToCart({ productId: product.id, quantity });
  };

  const handleTryOn = () => {
    if (!tryOnPhoto) {
      toast.error("Selecione uma foto");
      return;
    }
    // TODO: Upload da foto e processamento com IA
    createTryOn({
      productId: product.id,
      userPhotoUrl: "temp-url", // Será substituído pelo upload real
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <Button
          variant="ghost"
          onClick={() => setLocation("/")}
          className="gap-2 mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar
        </Button>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Images */}
          <div className="space-y-4">
            <div className="bg-gray-100 rounded-lg overflow-hidden h-96">
              <img
                src={product.imageUrl}
                alt={product.name}
                className="w-full h-full object-cover"
              />
            </div>
            {product.imageUrl2 && (
              <div className="bg-gray-100 rounded-lg overflow-hidden h-40">
                <img
                  src={product.imageUrl2}
                  alt={`${product.name} - 2`}
                  className="w-full h-full object-cover"
                />
              </div>
            )}
          </div>

          {/* Details */}
          <div className="space-y-6">
            <div>
              <h1 className="text-4xl font-bold text-gray-800 mb-2">
                {product.name}
              </h1>
              <p className="text-gray-600">{product.color}</p>
              {product.size && <p className="text-gray-600">Tamanho: {product.size}</p>}
            </div>

            <div>
              <p className="text-4xl font-bold text-purple-600">
                R$ {Number(product.price).toFixed(2)}
              </p>
              {product.stock && product.stock > 0 ? (
                <p className="text-green-600 font-semibold mt-2">Em estoque</p>
              ) : (
                <p className="text-red-600 font-semibold mt-2">Fora de estoque</p>
              )}
            </div>

            <div>
              <Label htmlFor="quantity">Quantidade</Label>
              <div className="flex items-center gap-2 mt-2">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-100"
                >
                  −
                </button>
                <Input
                  id="quantity"
                  type="number"
                  min="1"
                  value={quantity}
                  onChange={(e) => setQuantity(Math.max(1, Number(e.target.value)))}
                  className="w-20 text-center"
                />
                <button
                  onClick={() => setQuantity(quantity + 1)}
                  className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-100"
                >
                  +
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <Button
                onClick={handleAddToCart}
                className="w-full bg-purple-600 hover:bg-purple-700 py-6 text-lg"
                disabled={!product.stock || product.stock <= 0}
              >
                Adicionar ao Carrinho
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowTryOn(!showTryOn)}
                className="w-full"
              >
                Provador Virtual
              </Button>
            </div>

            {product.description && (
              <Card>
                <CardHeader>
                  <CardTitle>Descrição</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-700">{product.description}</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Try-On Section */}
        {showTryOn && (
          <Card className="mt-8">
            <CardHeader>
              <CardTitle>Provador Virtual</CardTitle>
              <CardDescription>
                Envie uma foto sua para ver como a roupa fica em você
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setTryOnPhoto(e.target.files?.[0] || null)}
                    className="hidden"
                    id="tryon-upload"
                  />
                  <label htmlFor="tryon-upload" className="cursor-pointer">
                    {tryOnPhoto ? (
                      <div>
                        <p className="font-semibold text-green-600">{tryOnPhoto.name}</p>
                        <p className="text-sm text-gray-600">Clique para alterar</p>
                      </div>
                    ) : (
                      <div>
                        <Upload className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                        <p className="font-semibold text-gray-700">Clique para enviar</p>
                        <p className="text-sm text-gray-600">ou arraste a imagem aqui</p>
                      </div>
                    )}
                  </label>
                </div>

                {tryOnPhoto && (
                  <div className="bg-gray-100 rounded-lg p-4 max-h-96 overflow-hidden">
                    <img
                      src={URL.createObjectURL(tryOnPhoto)}
                      alt="Preview"
                      className="w-full h-auto"
                    />
                  </div>
                )}

                <Button
                  onClick={handleTryOn}
                  className="w-full bg-purple-600 hover:bg-purple-700"
                  disabled={!tryOnPhoto}
                >
                  Provar Roupa
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
