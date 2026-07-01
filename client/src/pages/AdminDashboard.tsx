import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { trpc } from "@/lib/trpc";
import { LogOut, Plus } from "lucide-react";
import { useState } from "react";
import { useLocation } from "wouter";
import { toast } from "sonner";

export default function AdminDashboard() {
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState("orders");

  // Products
  const [productForm, setProductForm] = useState({
    categoryId: "",
    name: "",
    description: "",
    price: "",
    imageUrl: "",
    color: "",
    size: "",
    stock: "",
  });

  // Categories
  const [categoryForm, setCategoryForm] = useState({
    name: "",
    description: "",
  });

  const { data: orders } = trpc.adminOrders.list.useQuery();
  const { data: categories } = trpc.categories.list.useQuery();
  const { data: products } = trpc.products.list.useQuery();

  const { mutate: createProduct } = trpc.products.create.useMutation({
    onSuccess: () => {
      toast.success("Produto criado!");
      setProductForm({
        categoryId: "",
        name: "",
        description: "",
        price: "",
        imageUrl: "",
        color: "",
        size: "",
        stock: "",
      });
      trpc.useUtils().products.list.invalidate();
    },
  });

  const { mutate: createCategory } = trpc.categories.create.useMutation({
    onSuccess: () => {
      toast.success("Categoria criada!");
      setCategoryForm({ name: "", description: "" });
      trpc.useUtils().categories.list.invalidate();
    },
  });

  const { mutate: updateOrderStatus } = trpc.adminOrders.updateStatus.useMutation({
    onSuccess: () => {
      toast.success("Status atualizado!");
      trpc.useUtils().adminOrders.list.invalidate();
    },
  });

  const handleLogout = () => {
    setLocation("/");
    toast.success("Desconectado!");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50">
      {/* Header */}
      <header className="bg-white shadow-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-800">Painel Administrativo</h1>
          <Button
            variant="ghost"
            onClick={handleLogout}
            className="gap-2"
          >
            <LogOut className="w-4 h-4" />
            Sair
          </Button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="orders">Pedidos</TabsTrigger>
            <TabsTrigger value="products">Produtos</TabsTrigger>
            <TabsTrigger value="categories">Categorias</TabsTrigger>
            <TabsTrigger value="proofs">Comprovantes</TabsTrigger>
          </TabsList>

          {/* Orders Tab */}
          <TabsContent value="orders" className="space-y-4">
            <h2 className="text-2xl font-bold">Gerenciar Pedidos</h2>
            <div className="grid gap-4">
              {orders?.map((order) => (
                <Card key={order.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle>Pedido #{order.id}</CardTitle>
                        <CardDescription>
                          Cliente: {order.user?.name || "Desconhecido"}
                        </CardDescription>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-lg">
                          R$ {Number(order.totalPrice).toFixed(2)}
                        </p>
                        <p className="text-sm text-gray-600">
                          {new Date(order.createdAt).toLocaleDateString("pt-BR")}
                        </p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="font-semibold text-gray-700">Endereço:</p>
                        <p className="text-gray-600">
                          {order.street}, {order.number}
                        </p>
                        <p className="text-gray-600">{order.neighborhood}</p>
                        {order.complement && (
                          <p className="text-gray-600">{order.complement}</p>
                        )}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-700">Contato:</p>
                        <p className="text-gray-600">{order.contact}</p>
                      </div>
                    </div>

                    <div>
                      <p className="font-semibold text-gray-700 mb-2">Produtos:</p>
                      <ul className="text-sm text-gray-600 space-y-1">
                        {order.items?.map((item: any) => (
                          <li key={item.id}>
                            • {item.quantity}x Produto #{item.productId} - R$ {Number(item.price).toFixed(2)}
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="flex items-center gap-2">
                      <Label>Status:</Label>
                      <Select
                        value={order.status}
                        onValueChange={(status) =>
                          updateOrderStatus({ orderId: order.id, status: status as any })
                        }
                      >
                        <SelectTrigger className="w-40">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="em_analise">Em Análise</SelectItem>
                          <SelectItem value="preparando">Preparando</SelectItem>
                          <SelectItem value="entregue">Entregue</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Products Tab */}
          <TabsContent value="products" className="space-y-4">
            <h2 className="text-2xl font-bold">Gerenciar Produtos</h2>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Plus className="w-4 h-4" />
                  Adicionar Novo Produto
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    createProduct({
                      ...productForm,
                      categoryId: Number(productForm.categoryId),
                      stock: Number(productForm.stock),
                    });
                  }}
                  className="space-y-4"
                >
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="categoryId">Categoria *</Label>
                      <Select
                        value={productForm.categoryId}
                        onValueChange={(value) =>
                          setProductForm({ ...productForm, categoryId: value })
                        }
                      >
                        <SelectTrigger className="mt-1">
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                        <SelectContent>
                          {categories?.map((cat) => (
                            <SelectItem key={cat.id} value={cat.id.toString()}>
                              {cat.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="name">Nome *</Label>
                      <Input
                        id="name"
                        value={productForm.name}
                        onChange={(e) =>
                          setProductForm({ ...productForm, name: e.target.value })
                        }
                        className="mt-1"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="description">Descrição</Label>
                    <Input
                      id="description"
                      value={productForm.description}
                      onChange={(e) =>
                        setProductForm({ ...productForm, description: e.target.value })
                      }
                      className="mt-1"
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="price">Preço *</Label>
                      <Input
                        id="price"
                        type="number"
                        step="0.01"
                        value={productForm.price}
                        onChange={(e) =>
                          setProductForm({ ...productForm, price: e.target.value })
                        }
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="color">Cor</Label>
                      <Input
                        id="color"
                        value={productForm.color}
                        onChange={(e) =>
                          setProductForm({ ...productForm, color: e.target.value })
                        }
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="size">Tamanho</Label>
                      <Input
                        id="size"
                        value={productForm.size}
                        onChange={(e) =>
                          setProductForm({ ...productForm, size: e.target.value })
                        }
                        className="mt-1"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="imageUrl">URL da Imagem *</Label>
                      <Input
                        id="imageUrl"
                        value={productForm.imageUrl}
                        onChange={(e) =>
                          setProductForm({ ...productForm, imageUrl: e.target.value })
                        }
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="stock">Estoque</Label>
                      <Input
                        id="stock"
                        type="number"
                        value={productForm.stock}
                        onChange={(e) =>
                          setProductForm({ ...productForm, stock: e.target.value })
                        }
                        className="mt-1"
                      />
                    </div>
                  </div>

                  <Button type="submit" className="w-full bg-purple-600 hover:bg-purple-700">
                    Adicionar Produto
                  </Button>
                </form>
              </CardContent>
            </Card>

            <div className="space-y-2">
              <h3 className="font-semibold text-lg">Produtos Cadastrados</h3>
              {products?.map((product) => (
                <Card key={product.id}>
                  <CardContent className="p-4 flex items-center justify-between">
                    <div>
                      <p className="font-semibold">{product.name}</p>
                      <p className="text-sm text-gray-600">
                        R$ {Number(product.price).toFixed(2)} - Estoque: {product.stock}
                      </p>
                    </div>
                    <Button variant="outline" size="sm">
                      Editar
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Categories Tab */}
          <TabsContent value="categories" className="space-y-4">
            <h2 className="text-2xl font-bold">Gerenciar Categorias</h2>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Plus className="w-4 h-4" />
                  Adicionar Nova Categoria
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    createCategory(categoryForm);
                  }}
                  className="space-y-4"
                >
                  <div>
                    <Label htmlFor="catName">Nome *</Label>
                    <Input
                      id="catName"
                      value={categoryForm.name}
                      onChange={(e) =>
                        setCategoryForm({ ...categoryForm, name: e.target.value })
                      }
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label htmlFor="catDesc">Descrição</Label>
                    <Input
                      id="catDesc"
                      value={categoryForm.description}
                      onChange={(e) =>
                        setCategoryForm({ ...categoryForm, description: e.target.value })
                      }
                      className="mt-1"
                    />
                  </div>

                  <Button type="submit" className="w-full bg-purple-600 hover:bg-purple-700">
                    Adicionar Categoria
                  </Button>
                </form>
              </CardContent>
            </Card>

            <div className="space-y-2">
              <h3 className="font-semibold text-lg">Categorias Cadastradas</h3>
              {categories?.map((category) => (
                <Card key={category.id}>
                  <CardContent className="p-4 flex items-center justify-between">
                    <div>
                      <p className="font-semibold">{category.name}</p>
                      {category.description && (
                        <p className="text-sm text-gray-600">{category.description}</p>
                      )}
                    </div>
                    <Button variant="outline" size="sm">
                      Editar
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Proofs Tab */}
          <TabsContent value="proofs" className="space-y-4">
            <h2 className="text-2xl font-bold">Comprovantes de Pagamento</h2>
            <div className="grid gap-4">
              {orders
                ?.filter((order) => order.proofImageUrl)
                .map((order) => (
                  <Card key={order.id}>
                    <CardHeader>
                      <CardTitle>Pedido #{order.id}</CardTitle>
                      <CardDescription>
                        {new Date(order.createdAt).toLocaleDateString("pt-BR")}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {order.proofImageUrl && (
                        <div className="max-w-md">
                          <img
                            src={order.proofImageUrl}
                            alt="Comprovante"
                            className="w-full rounded-lg"
                          />
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
