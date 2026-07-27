import { MegamenuItem, NavItemType } from "@/shared/Navigation/NavigationItem";
import ncNanoId from "@/utils/ncNanoId";
import { Route } from "@/routers/types";
import __megamenu from "./jsons/__megamenu.json";

const megaMenuDemo: MegamenuItem[] = [
  {
    id: ncNanoId(),
    image:
      "https://images.pexels.com/photos/1591373/pexels-photo-1591373.jpeg?auto=compress&cs=tinysrgb&dpr=1&w=500",
    title: "Company",
    items: __megamenu.map((i) => ({
      id: ncNanoId(),
      href: "/",
      name: i.Company,
    })),
  },
  {
    id: ncNanoId(),
    image:
      "https://images.pexels.com/photos/2662116/pexels-photo-2662116.jpeg?auto=compress&cs=tinysrgb&dpr=1&w=500",
    title: "App Name",
    items: __megamenu.map((i) => ({
      id: ncNanoId(),
      href: "/",
      name: i.AppName,
    })),
  },
  {
    id: ncNanoId(),
    image:
      "https://images.pexels.com/photos/5059013/pexels-photo-5059013.jpeg?auto=compress&cs=tinysrgb&dpr=1&w=500",
    title: "City",
    items: __megamenu.map((i) => ({
      id: ncNanoId(),
      href: "/",
      name: i.City,
    })),
  },
  {
    id: ncNanoId(),
    image:
      "https://images.pexels.com/photos/5159141/pexels-photo-5159141.jpeg?auto=compress&cs=tinysrgb&dpr=1&w=500",
    title: "Contruction",
    items: __megamenu.map((i) => ({
      id: ncNanoId(),
      href: "/",
      name: i.Contruction,
    })),
  },
  {
    id: ncNanoId(),
    image:
      "https://images.pexels.com/photos/7473041/pexels-photo-7473041.jpeg?auto=compress&cs=tinysrgb&dpr=1&w=500",
    title: "Country",
    items: __megamenu.map((i) => ({
      id: ncNanoId(),
      href: "/",
      name: i.Country,
    })),
  },
];

const demoChildMenus: NavItemType[] = [
  {
    id: ncNanoId(),
    href: "/",
    name: "Online booking",
  },
];

const otherPageChildMenus: NavItemType[] = [
  { id: ncNanoId(), href: "/blog", name: "Blog page" },
  { id: ncNanoId(), href: "/blog/single" as Route, name: "Blog single" },
  { id: ncNanoId(), href: "/about", name: "About" },
  { id: ncNanoId(), href: "/contact", name: "Contact us" },
  { id: ncNanoId(), href: "/login", name: "Login" },
  { id: ncNanoId(), href: "/signup", name: "Signup" },
];

const templatesChildrenMenus: NavItemType[] = [
  { id: ncNanoId(), href: "/services?category=FOOD" as Route, name: "Food Services" },
  { id: ncNanoId(), href: "/laundry-services" as Route, name: "Laundry Services" },
];

// Thêm module Admin Management vào menu
const adminManagementMenus: NavItemType[] = [
  { id: ncNanoId(), href: "/admin/incidents/create" as Route, name: "Sự cố phòng" },
  { id: ncNanoId(), href: "/admin/lost-found/create" as Route, name: "Đồ thất lạc" },
];

export const NAVIGATION_DEMO: NavItemType[] = [
  {
    id: ncNanoId(),
    href: "/",
    name: "Home",
    type: "dropdown",
    children: demoChildMenus,
    isNew: true,
  },
  {
    id: ncNanoId(),
    href: "/",
    name: "Five columns",
    type: "megaMenu",
    megaMenu: megaMenuDemo,
  },
  {
    id: ncNanoId(),
    href: "/listing-stay",
    name: "Listing Page",
    type: "dropdown",
    children: [
      {
        id: ncNanoId(),
        href: "/listing-stay",
        name: "Stay listings",
        type: "dropdown",
        children: [
          { id: ncNanoId(), href: "/listing-stay", name: "Stay page" },
          {
            id: ncNanoId(),
            href: "/listing-stay-map",
            name: "Stay page (map)",
          },
        ],
      },
      {
        id: ncNanoId(),
        href: "/listing-experiences",
        name: "Experiences listings",
        type: "dropdown",
        children: [
          {
            id: ncNanoId(),
            href: "/listing-experiences",
            name: "Experiences page",
          },
          {
            id: ncNanoId(),
            href: "/listing-experiences-map",
            name: "Experiences page (map)",
          },
        ],
      },
      {
        id: ncNanoId(),
        href: "/listing-car",
        name: "Cars listings",
        type: "dropdown",
        children: [
          { id: ncNanoId(), href: "/listing-car", name: "Cars page" },
          { id: ncNanoId(), href: "/listing-car-map", name: "Cars page (map)" },
        ],
      },
    ],
  },
  {
    id: ncNanoId(),
    href: "/author",
    name: "Templates",
    type: "dropdown",
    children: templatesChildrenMenus,
  },
  // Module mới thêm
  {
    id: ncNanoId(),
    href: "/admin/incidents/create" as Route,
    name: "Admin",
    type: "dropdown",
    children: adminManagementMenus,
  },
  {
    id: ncNanoId(),
    href: "/blog",
    name: "Other pages",
    type: "dropdown",
    children: otherPageChildMenus,
  },
];

export const NAVIGATION_DEMO_2: NavItemType[] = [
  {
    id: ncNanoId(),
    href: "/listing-stay",
    name: "Hotel Stay",
    children: [
      { id: ncNanoId(), href: "/", name: "Online booking" },
      { id: ncNanoId(), href: "/listing-stay", name: "Stay listings" },
      { id: ncNanoId(), href: "/listing-stay-map", name: "Stay listings (map)" },
    ],
  },
  {
    id: ncNanoId(),
    href: "/listing-car",
    name: "Cars & Experiences",
    children: [
      { id: ncNanoId(), href: "/listing-car", name: "Cars listings" },
      { id: ncNanoId(), href: "/listing-experiences", name: "Experiences listings" },
      { id: ncNanoId(), href: "/listing-experiences-map", name: "Experiences (map)" },
    ],
  },
  {
    id: ncNanoId(),
    href: "/services?category=FOOD" as Route,
    name: "Resort Services",
    children: [
      { id: ncNanoId(), href: "/services?category=FOOD" as Route, name: "Food Services" }, 
      { id: ncNanoId(), href: "/laundry-services" as Route, name: "Laundry Services" }, 
    ],
  },
  {
    id: ncNanoId(),
    href: "/admin/incidents/create" as Route,
    name: "Admin Management",
    children: adminManagementMenus,
  },
];