import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router, protectedProcedure } from "./_core/trpc";
import * as db from "./db";
import { z } from "zod";
import crypto from "crypto";
import { TRPCError } from "@trpc/server";

// ===== ADMIN PROCEDURE =====
const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== 'admin') {
    throw new TRPCError({ code: 'FORBIDDEN', message: 'Admin access required' });
  }
  return next({ ctx });
});

export const appRouter = router({
  system: systemRouter,
  
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  // ===== CATEGORIES =====
  categories: router({
    list: publicProcedure.query(async () => {
      return db.getCategories();
    }),
    
    getById: publicProcedure.input(z.number()).query(async ({ input }) => {
      return db.getCategoryById(input);
    }),
    
    create: adminProcedure
      .input(z.object({
        name: z.string(),
        description: z.string().optional(),
        imageUrl: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        return db.createCategory(input);
      }),
    
    update: adminProcedure
      .input(z.object({
        id: z.number(),
        name: z.string().optional(),
        description: z.string().optional(),
        imageUrl: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        return db.updateCategory(id, data);
      }),
    
    delete: adminProcedure
      .input(z.number())
      .mutation(async ({ input }) => {
        return db.deleteCategory(input);
      }),
  }),

  // ===== PRODUCTS =====
  products: router({
    list: publicProcedure.query(async () => {
      return db.getProducts();
    }),
    
    getById: publicProcedure.input(z.number()).query(async ({ input }) => {
      return db.getProductById(input);
    }),
    
    getByCategory: publicProcedure.input(z.number()).query(async ({ input }) => {
      return db.getProductsByCategory(input);
    }),
    
    create: adminProcedure
      .input(z.object({
        categoryId: z.number(),
        name: z.string(),
        description: z.string().optional(),
        price: z.string(),
        imageUrl: z.string(),
        imageUrl2: z.string().optional(),
        imageUrl3: z.string().optional(),
        size: z.string().optional(),
        color: z.string().optional(),
        stock: z.number().optional(),
      }))
      .mutation(async ({ input }) => {
        return db.createProduct(input);
      }),
    
    update: adminProcedure
      .input(z.object({
        id: z.number(),
        categoryId: z.number().optional(),
        name: z.string().optional(),
        description: z.string().optional(),
        price: z.string().optional(),
        imageUrl: z.string().optional(),
        imageUrl2: z.string().optional(),
        imageUrl3: z.string().optional(),
        size: z.string().optional(),
        color: z.string().optional(),
        stock: z.number().optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        return db.updateProduct(id, data);
      }),
    
    delete: adminProcedure
      .input(z.number())
      .mutation(async ({ input }) => {
        return db.deleteProduct(input);
      }),
  }),

  // ===== CART =====
  cart: router({
    getItems: protectedProcedure.query(async ({ ctx }) => {
      const cartItems = await db.getCartItems(ctx.user.id);
      
      // Enrich with product details
      const enriched = await Promise.all(
        cartItems.map(async (item) => {
          const product = await db.getProductById(item.productId);
          return { ...item, product };
        })
      );
      
      return enriched;
    }),
    
    addItem: protectedProcedure
      .input(z.object({
        productId: z.number(),
        quantity: z.number().default(1),
      }))
      .mutation(async ({ input, ctx }) => {
        return db.addToCart(ctx.user.id, input.productId, input.quantity);
      }),
    
    updateItem: protectedProcedure
      .input(z.object({
        productId: z.number(),
        quantity: z.number(),
      }))
      .mutation(async ({ input, ctx }) => {
        return db.updateCartItem(ctx.user.id, input.productId, input.quantity);
      }),
    
    removeItem: protectedProcedure
      .input(z.number())
      .mutation(async ({ input, ctx }) => {
        return db.removeFromCart(ctx.user.id, input);
      }),
    
    clear: protectedProcedure.mutation(async ({ ctx }) => {
      return db.clearCart(ctx.user.id);
    }),
  }),

  // ===== ORDERS =====
  orders: router({
    create: protectedProcedure
      .input(z.object({
        street: z.string(),
        neighborhood: z.string(),
        number: z.string(),
        complement: z.string().optional(),
        complementType: z.enum(['casa', 'apartamento', 'condominio']).optional(),
        contact: z.string(),
        items: z.array(z.object({
          productId: z.number(),
          quantity: z.number(),
          price: z.string(),
        })),
        totalPrice: z.string(),
      }))
      .mutation(async ({ input, ctx }) => {
        const { items, ...orderData } = input;
        
        const result = await db.createOrder({
          userId: ctx.user.id,
          ...orderData,
        });
        
        const orderId = (result as any).insertId;
        
        await db.createOrderItems(
          items.map(item => ({
            orderId,
            ...item,
          }))
        );
        
        await db.clearCart(ctx.user.id);
        
        return { orderId, success: true };
      }),
    
    getMyOrders: protectedProcedure.query(async ({ ctx }) => {
      return db.getOrdersByUserId(ctx.user.id);
    }),
    
    getById: protectedProcedure.input(z.number()).query(async ({ input, ctx }) => {
      const order = await db.getOrderById(input);
      if (!order || order.userId !== ctx.user.id) {
        throw new TRPCError({ code: 'NOT_FOUND' });
      }
      const items = await db.getOrderItems(input);
      return { ...order, items };
    }),
    
    uploadProof: protectedProcedure
      .input(z.object({
        orderId: z.number(),
        proofImageUrl: z.string(),
      }))
      .mutation(async ({ input, ctx }) => {
        const order = await db.getOrderById(input.orderId);
        if (!order || order.userId !== ctx.user.id) {
          throw new TRPCError({ code: 'FORBIDDEN' });
        }
        return db.updateOrderProofImage(input.orderId, input.proofImageUrl);
      }),
  }),

  // ===== ADMIN ORDERS =====
  adminOrders: router({
    list: adminProcedure.query(async () => {
      const allOrders = await db.getAllOrders();
      const enriched = await Promise.all(
        allOrders.map(async (order) => {
          const items = await db.getOrderItems(order.id);
          const user = await db.getUserByOpenId(order.userId.toString());
          return { ...order, items, user };
        })
      );
      return enriched;
    }),
    
    updateStatus: adminProcedure
      .input(z.object({
        orderId: z.number(),
        status: z.enum(['em_analise', 'preparando', 'entregue']),
      }))
      .mutation(async ({ input }) => {
        return db.updateOrderStatus(input.orderId, input.status);
      }),
  }),

  // ===== TRY-ON =====
  tryOn: router({
    create: protectedProcedure
      .input(z.object({
        productId: z.number(),
        userPhotoUrl: z.string(),
        resultImageUrl: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        return db.createTryOnPhoto(
          ctx.user.id,
          input.productId,
          input.userPhotoUrl,
          input.resultImageUrl
        );
      }),
    
    getMyPhotos: protectedProcedure.query(async ({ ctx }) => {
      return db.getTryOnPhotos(ctx.user.id);
    }),
  }),

  // ===== ADMIN AUTH =====
  adminAuth: router({
    login: publicProcedure
      .input(z.object({
        username: z.string(),
        password: z.string(),
      }))
      .mutation(async ({ input, ctx }) => {
        const admin = await db.getAdminByUsername(input.username);
        
        if (!admin) {
          throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Invalid credentials' });
        }
        
        const passwordHash = crypto
          .createHash('sha256')
          .update(input.password)
          .digest('hex');
        
        if (admin.passwordHash !== passwordHash) {
          throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Invalid credentials' });
        }
        
        // Set admin session cookie
        const token = crypto.randomBytes(32).toString('hex');
        const cookieOptions = getSessionCookieOptions(ctx.req);
        ctx.res.cookie('admin_token', token, {
          ...cookieOptions,
          maxAge: 24 * 60 * 60 * 1000,
        });
        
        return { success: true, adminId: admin.id };
      }),
    
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie('admin_token', { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),
});

export type AppRouter = typeof appRouter;
