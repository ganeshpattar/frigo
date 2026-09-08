import type { Category, Product } from '@/types'
import { PERMISSIONS } from '@/constants'
import type { AuthUser } from '@/types'

import imgChatniDark from '@/assets/Image.jpeg'
import imgSajjiRotti from '@/assets/Image_1.jpeg'
import imgPickleLemon from '@/assets/Image_2.jpeg'
import imgPickleSpices from '@/assets/Image_3.jpeg'
import imgJawarRotti from '@/assets/Image_4.jpeg'
import imgRottiThali from '@/assets/Image_5.jpeg'
import imgMangoPickle from '@/assets/Image_6.jpeg'
import imgRottiPickle from '@/assets/Image_7.jpeg'
import imgRottiCurry from '@/assets/Image_8.jpeg'
import imgChatniPot from '@/assets/Image_9.jpeg'
import imgChatniGarlic from '@/assets/Image_10.jpeg'
import imgSajjiPour from '@/assets/Image_11.jpeg'
import imgRottiChatni from '@/assets/Image_12.jpeg'
import imgRottiMeal from '@/assets/Image_13.jpeg'
import imgMangoGreen from '@/assets/Image_14.jpeg'
import imgRagiMeal from '@/assets/Image_15.jpeg'
import imgPickleChilli from '@/assets/Image_16.jpeg'
import imgJawarGrains from '@/assets/Image_17.jpeg'
import imgLemonPickle from '@/assets/Image_18.jpeg'
import imgVegPickle from '@/assets/Image_19.jpeg'

export const CATALOG_IMAGES = {
  chatniDark: imgChatniDark,
  sajjiRotti: imgSajjiRotti,
  pickleLemon: imgPickleLemon,
  pickleSpices: imgPickleSpices,
  jawarRotti: imgJawarRotti,
  rottiThali: imgRottiThali,
  mangoPickle: imgMangoPickle,
  rottiPickle: imgRottiPickle,
  rottiCurry: imgRottiCurry,
  chatniPot: imgChatniPot,
  chatniGarlic: imgChatniGarlic,
  sajjiPour: imgSajjiPour,
  rottiChatni: imgRottiChatni,
  rottiMeal: imgRottiMeal,
  mangoGreen: imgMangoGreen,
  ragiMeal: imgRagiMeal,
  pickleChilli: imgPickleChilli,
  jawarGrains: imgJawarGrains,
  lemonPickle: imgLemonPickle,
  vegPickle: imgVegPickle,
} as const

export const MOCK_CATEGORIES: Category[] = [
  {
    id: 'cat_pickles',
    name: 'Pickles',
    slug: 'pickles',
    description: 'Homestyle avakai-style pickles — mango, lemon, chilli, veg & tomato',
    imageUrl: CATALOG_IMAGES.mangoPickle,
    status: 'ACTIVE',
    productCount: 5,
  },
  {
    id: 'cat_chatni',
    name: 'Chatni',
    slug: 'chatni',
    description: 'Dry powders — senga, putani, karal, agasi, banad hittu & gural',
    imageUrl: CATALOG_IMAGES.chatniPot,
    status: 'ACTIVE',
    productCount: 6,
  },
  {
    id: 'cat_rotti',
    name: 'Rotti',
    slug: 'rotti',
    description: 'Fresh millet flatbreads — jawar, sajji, ragi and more',
    imageUrl: CATALOG_IMAGES.jawarRotti,
    status: 'ACTIVE',
    productCount: 4,
  },
  {
    id: 'cat_holige',
    name: 'Holige',
    slug: 'holige',
    description: 'Festive sweets — kai holige, senga holige & obbattu',
    imageUrl: CATALOG_IMAGES.rottiMeal,
    status: 'ACTIVE',
    productCount: 3,
  },
]

function product(
  partial: Omit<Product, 'currency' | 'status' | 'images'> & {
    image: string
  },
): Product {
  const { image, ...rest } = partial
  return {
    ...rest,
    currency: 'INR',
    status: 'ACTIVE',
    images: [
      {
        id: `img_${rest.id}`,
        url: image,
        altText: rest.name,
        isPrimary: true,
        sortOrder: 0,
      },
    ],
  }
}

export const MOCK_PRODUCTS: Product[] = [
  // Pickles
  product({
    id: 'prod_mango_pickle',
    name: 'Mango Pickle',
    slug: 'mango-pickle',
    shortDescription: 'Tangy raw mango in spicy oil masala',
    description:
      'Traditional homemade mango pickle with mustard, chilli, and aromatic spices. Perfect with rotti or rice.',
    categoryId: 'cat_pickles',
    categoryName: 'Pickles',
    unitPrice: 180,
    isAvailable: true,
    tags: ['popular', 'spicy'],
    image: CATALOG_IMAGES.mangoPickle,
  }),
  product({
    id: 'prod_lemon_pickle',
    name: 'Lemon Pickle',
    slug: 'lemon-pickle',
    shortDescription: 'Zesty lemon pickle with chilli & spices',
    description:
      'Sun-cured lemon pickle with a bright citrus tang and house spice blend. A North Karnataka favourite.',
    categoryId: 'cat_pickles',
    categoryName: 'Pickles',
    unitPrice: 160,
    isAvailable: true,
    tags: ['tangy'],
    image: CATALOG_IMAGES.lemonPickle,
  }),
  product({
    id: 'prod_chilli_pickle',
    name: 'Chilli Pickle',
    slug: 'chilli-pickle',
    shortDescription: 'Fiery red chilli pickle in aromatic oil',
    description:
      'Bold chilli pickle made with dried red chillies, garlic, and tempering spices. Best with hot jawar rotti.',
    categoryId: 'cat_pickles',
    categoryName: 'Pickles',
    unitPrice: 150,
    isAvailable: true,
    tags: ['spicy'],
    image: CATALOG_IMAGES.pickleChilli,
  }),
  product({
    id: 'prod_veg_pickle',
    name: 'Veg Pickle',
    slug: 'veg-pickle',
    shortDescription: 'Mixed vegetable pickle, chunky & flavourful',
    description:
      'Assorted seasonal vegetables pickled in a rich masala oil. Homestyle taste in every jar.',
    categoryId: 'cat_pickles',
    categoryName: 'Pickles',
    unitPrice: 170,
    isAvailable: true,
    tags: ['vegetarian'],
    image: CATALOG_IMAGES.vegPickle,
  }),
  product({
    id: 'prod_tomato_pickle',
    name: 'Tomato Pickle',
    slug: 'tomato-pickle',
    shortDescription: 'Ripe tomato pickle with garlic & chilli',
    description:
      'Slow-cooked tomato pickle with garlic, mustard, and red chilli. Soft, spicy, and perfect with rice or rotti.',
    categoryId: 'cat_pickles',
    categoryName: 'Pickles',
    unitPrice: 155,
    isAvailable: true,
    tags: ['popular'],
    image: CATALOG_IMAGES.pickleLemon,
  }),

  // Chatni
  product({
    id: 'prod_senga_chatni',
    name: 'Senga Chatni',
    slug: 'senga-chatni',
    shortDescription: 'Roasted peanut dry chutney powder',
    description:
      'Crunchy roasted peanut (senga) chutney powder with chilli and garlic. Classic accompaniment for millet rotti.',
    categoryId: 'cat_chatni',
    categoryName: 'Chatni',
    unitPrice: 120,
    isAvailable: true,
    tags: ['popular'],
    image: CATALOG_IMAGES.chatniGarlic,
  }),
  product({
    id: 'prod_putani_chatni',
    name: 'Putani Chatni',
    slug: 'putani-chatni',
    shortDescription: 'Roasted gram dry chutney',
    description:
      'Putani (roasted chana) powder blended with spices. Light, nutty, and ideal with jawar or sajji rotti.',
    categoryId: 'cat_chatni',
    categoryName: 'Chatni',
    unitPrice: 110,
    isAvailable: true,
    tags: [],
    image: CATALOG_IMAGES.rottiChatni,
  }),
  product({
    id: 'prod_karal_chatni',
    name: 'Karal Chatni',
    slug: 'karal-chatni',
    shortDescription: 'Niger seed dry chutney',
    description:
      'Earthy karal (niger seed) chutney powder — dark, aromatic, and traditionally served with millet breads.',
    categoryId: 'cat_chatni',
    categoryName: 'Chatni',
    unitPrice: 130,
    isAvailable: true,
    tags: ['traditional'],
    image: CATALOG_IMAGES.chatniDark,
  }),
  product({
    id: 'prod_agasi_chatni',
    name: 'Agasi Chatni',
    slug: 'agasi-chatni',
    shortDescription: 'Flax seed chutney powder',
    description:
      'Nutritious agasi (flaxseed) chutney with chilli and garlic. Rich texture and wholesome flavour.',
    categoryId: 'cat_chatni',
    categoryName: 'Chatni',
    unitPrice: 125,
    isAvailable: true,
    tags: ['healthy'],
    image: CATALOG_IMAGES.chatniPot,
  }),
  product({
    id: 'prod_banad_hittu',
    name: 'Banad Hittu',
    slug: 'banad-hittu',
    shortDescription: 'Ground spice powder for seasoning',
    description:
      'Banad hittu — a fragrant dry spice mix used as a finishing powder with hot rotti and rice.',
    categoryId: 'cat_chatni',
    categoryName: 'Chatni',
    unitPrice: 115,
    isAvailable: true,
    tags: [],
    image: CATALOG_IMAGES.pickleSpices,
  }),
  product({
    id: 'prod_gural_chatni',
    name: 'Gural Chatni',
    slug: 'gural-chatni',
    shortDescription: 'Gural seed dry chutney',
    description:
      'Traditional gural chutney powder with a deep roasted flavour. Pair with fresh jawar rotti.',
    categoryId: 'cat_chatni',
    categoryName: 'Chatni',
    unitPrice: 135,
    isAvailable: true,
    tags: ['traditional'],
    image: CATALOG_IMAGES.chatniDark,
  }),

  // Rotti
  product({
    id: 'prod_jawar_rotti',
    name: 'Jawar Rotti',
    slug: 'jawar-rotti',
    shortDescription: 'Soft sorghum (jowar) flatbread',
    description:
      'Hand-rolled jawar (jolada) rotti made fresh. Soft, wholesome, and best enjoyed with pickle and chatni.',
    categoryId: 'cat_rotti',
    categoryName: 'Rotti',
    unitPrice: 40,
    isAvailable: true,
    tags: ['popular', 'millet'],
    image: CATALOG_IMAGES.jawarGrains,
  }),
  product({
    id: 'prod_sajji_rotti',
    name: 'Sajji Rotti',
    slug: 'sajji-rotti',
    shortDescription: 'Pearl millet flatbread',
    description:
      'Rustic sajji (bajra) rotti with a coarse texture and earthy taste. A North Karnataka staple.',
    categoryId: 'cat_rotti',
    categoryName: 'Rotti',
    unitPrice: 45,
    isAvailable: true,
    tags: ['millet'],
    image: CATALOG_IMAGES.sajjiPour,
  }),
  product({
    id: 'prod_ragi_rotti',
    name: 'Ragi Rotti',
    slug: 'ragi-rotti',
    shortDescription: 'Finger millet flatbread',
    description:
      'Nutritious ragi rotti with a distinctive flavour. Served hot — excellent with senga chatni.',
    categoryId: 'cat_rotti',
    categoryName: 'Rotti',
    unitPrice: 45,
    isAvailable: true,
    tags: ['healthy', 'millet'],
    image: CATALOG_IMAGES.ragiMeal,
  }),
  product({
    id: 'prod_akki_rotti',
    name: 'Akki Rotti',
    slug: 'akki-rotti',
    shortDescription: 'Rice flour flatbread with spices',
    description:
      'Soft akki rotti made with rice flour and mild spices. Mild, comforting, and family-friendly.',
    categoryId: 'cat_rotti',
    categoryName: 'Rotti',
    unitPrice: 50,
    isAvailable: true,
    tags: [],
    image: CATALOG_IMAGES.rottiCurry,
  }),

  // Holige
  product({
    id: 'prod_kai_holige',
    name: 'Kai Holige',
    slug: 'kai-holige',
    shortDescription: 'Coconut-stuffed sweet flatbread',
    description:
      'Soft kai holige filled with sweetened coconut. A festive classic for celebrations and family meals.',
    categoryId: 'cat_holige',
    categoryName: 'Holige',
    unitPrice: 60,
    isAvailable: true,
    tags: ['sweet', 'popular'],
    image: CATALOG_IMAGES.rottiMeal,
  }),
  product({
    id: 'prod_senga_holige',
    name: 'Senga Holige',
    slug: 'senga-holige',
    shortDescription: 'Peanut-stuffed sweet holige',
    description:
      'Golden senga holige with a roasted peanut filling. Sweet, nutty, and perfect with ghee.',
    categoryId: 'cat_holige',
    categoryName: 'Holige',
    unitPrice: 65,
    isAvailable: true,
    tags: ['sweet'],
    image: CATALOG_IMAGES.rottiThali,
  }),
  product({
    id: 'prod_obbattu_holige',
    name: 'Obbattu Holige',
    slug: 'obbattu-holige',
    shortDescription: 'Traditional toor dal sweet holige',
    description:
      'Classic obbattu (holige) with a rich sweet dal filling. Soft, fragrant, and made the traditional way.',
    categoryId: 'cat_holige',
    categoryName: 'Holige',
    unitPrice: 70,
    isAvailable: true,
    tags: ['sweet', 'festive'],
    image: CATALOG_IMAGES.rottiPickle,
  }),
]

const allPermissions = Object.values(PERMISSIONS)

export const MOCK_USERS: Record<string, AuthUser & { password: string }> = {
  'admin@frigo.test': {
    id: 'user_admin',
    email: 'admin@frigo.test',
    firstName: 'Ava',
    lastName: 'Admin',
    roles: ['ADMIN'],
    permissions: allPermissions,
    status: 'ACTIVE',
    password: 'Admin123!',
  },
  'manager@frigo.test': {
    id: 'user_manager',
    email: 'manager@frigo.test',
    firstName: 'Morgan',
    lastName: 'Manager',
    roles: ['MANAGER'],
    permissions: [
      PERMISSIONS.DASHBOARD_VIEW,
      PERMISSIONS.ORDERS_READ,
      PERMISSIONS.ORDERS_MANAGE,
      PERMISSIONS.CUSTOMERS_READ,
      PERMISSIONS.INVENTORY_READ,
      PERMISSIONS.INVENTORY_WRITE,
      PERMISSIONS.CATALOG_READ,
    ],
    status: 'ACTIVE',
    password: 'Manager123!',
  },
  'customer@frigo.test': {
    id: 'user_customer',
    email: 'customer@frigo.test',
    firstName: 'Casey',
    lastName: 'Customer',
    roles: ['CUSTOMER'],
    permissions: [],
    status: 'ACTIVE',
    password: 'Customer123!',
  },
}

export function delay(ms = 400): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}
