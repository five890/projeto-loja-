import mysql from 'mysql2/promise';
import crypto from 'crypto';

const connection = await mysql.createConnection(process.env.DATABASE_URL);

// Criar categorias
const categories = [
  { name: 'Camisetas', description: 'Camisetas e tops' },
  { name: 'Calças', description: 'Calças e shorts' },
  { name: 'Vestidos', description: 'Vestidos e saias' },
  { name: 'Jaquetas', description: 'Jaquetas e casacos' },
];

for (const cat of categories) {
  await connection.execute(
    'INSERT INTO categories (name, description) VALUES (?, ?)',
    [cat.name, cat.description]
  );
}

console.log('✓ Categorias criadas');

// Criar produtos de exemplo
const products = [
  {
    categoryId: 1,
    name: 'Camiseta Básica Branca',
    description: 'Camiseta 100% algodão, confortável e versátil',
    price: '49.90',
    imageUrl: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=500&h=500&fit=crop',
    color: 'Branco',
    size: 'M',
    stock: 50,
  },
  {
    categoryId: 1,
    name: 'Camiseta Preta Premium',
    description: 'Camiseta premium com acabamento especial',
    price: '79.90',
    imageUrl: 'https://images.unsplash.com/photo-1503341455253-b2e723bb3db1?w=500&h=500&fit=crop',
    color: 'Preto',
    size: 'M',
    stock: 30,
  },
  {
    categoryId: 2,
    name: 'Calça Jeans Azul',
    description: 'Calça jeans clássica, confortável e durável',
    price: '129.90',
    imageUrl: 'https://images.unsplash.com/photo-1542272604-787c62d465d1?w=500&h=500&fit=crop',
    color: 'Azul',
    size: 'M',
    stock: 25,
  },
  {
    categoryId: 3,
    name: 'Vestido Floral',
    description: 'Vestido floral elegante para qualquer ocasião',
    price: '159.90',
    imageUrl: 'https://images.unsplash.com/photo-1595777707802-41d339d29c51?w=500&h=500&fit=crop',
    color: 'Floral',
    size: 'M',
    stock: 15,
  },
  {
    categoryId: 4,
    name: 'Jaqueta de Couro',
    description: 'Jaqueta de couro genuíno, estilo clássico',
    price: '299.90',
    imageUrl: 'https://images.unsplash.com/photo-1551028719-00167b16ebc5?w=500&h=500&fit=crop',
    color: 'Preto',
    size: 'M',
    stock: 10,
  },
];

for (const prod of products) {
  await connection.execute(
    'INSERT INTO products (categoryId, name, description, price, imageUrl, color, size, stock) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
    [prod.categoryId, prod.name, prod.description, prod.price, prod.imageUrl, prod.color, prod.size, prod.stock]
  );
}

console.log('✓ Produtos criados');

// Criar admin padrão
const passwordHash = crypto
  .createHash('sha256')
  .update('michele3005')
  .digest('hex');

await connection.execute(
  'INSERT INTO admin_users (username, passwordHash) VALUES (?, ?)',
  ['murillo', passwordHash]
);

console.log('✓ Admin criado (murillo/michele3005)');

await connection.end();
console.log('✓ Seed concluído com sucesso!');
