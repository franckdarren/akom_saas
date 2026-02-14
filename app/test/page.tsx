// import prisma from '@/lib/prisma'
"use client"

import { useEffect, useState } from "react"
import prisma from '../../lib/prisma'
import { Card } from "@/components/ui/card"
import { Star, Clock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ShoppingCart } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"




type Props = {
    title: string
    items: any[]
}

type CarteButtonProps = {
    count: number
}

type MenuSectionProps = {
    title: string
    items: any[]
    onAdd: () => void
    onRemove: () => void
}

type RestaurantHeaderProps = {
    count: number
}

export function CartButton({ count }: CarteButtonProps) {
    return (
        <motion.div
            className="relative"
            animate={{ scale: count > 0 ? [1, 1.15, 1] : 1 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
        >
            <Button
                size="icon"
                className="rounded-full bg-white/90 hover:bg-white shadow-lg"
            >
                <ShoppingCart className="w-5 h-5 text-black" />
            </Button>

            {/* Badge animé */}
            <AnimatePresence>
                {count > 0 && (
                    <motion.span
                        key={count}
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0, opacity: 0 }}
                        transition={{ type: "spring", stiffness: 300 }}
                        className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-medium"
                    >
                        {count}
                    </motion.span>
                )}
            </AnimatePresence>
        </motion.div>
    )
}

export function RestaurantHeader({ count }: RestaurantHeaderProps) {
    return (
        <div className="relative h-64 w-full">
            <img
                src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRRHJfO09fobN82zLFHwCAajY3LVueyfM4X7A&s"
                className="h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-black/40" />

            {/* Panier fixé */}
            <div className="fixed top-4 right-4 z-60">
                <CartButton count={count} />
            </div>
        </div>
    )
}


export function RestaurantInfo() {
    return (
        <Card className="p-4 rounded-2xl shadow-lg mx-4">
            <div className="flex justify-between items-start">
                <div>
                    <h1 className="text-lg font-semibold">
                        Le TIVOLI - Restaurant
                    </h1>

                    <div className="flex items-center gap-3 mt-2 text-sm text-muted-foreground">
                        <span>Charbonnages</span>
                    </div>
                </div>
            </div>
        </Card>
    )
}

export function MenuSection({
    title,
    items,
    onAdd,
    onRemove,
}: MenuSectionProps) {
    return (
        <section>
            <h2 className="text-lg font-semibold mb-4 mx-4">{title}</h2>

            <div className="space-y-4">
                {items.map((item) => (
                    <MenuItem
                        key={item.id}
                        item={item}
                        onAdd={onAdd}
                        onRemove={onRemove}
                    />
                ))}
            </div>
        </section>
    )
}


export function MenuItem({
    item,
    onAdd,
    onRemove,
}: {
    item: any
    onAdd: () => void
    onRemove: () => void
}) {
    const [qty, setQty] = useState(0)

    const increment = () => {
        setQty((q) => q + 1)
        onAdd() // 🔥 déclenche animation panier
    }

    const decrement = () => {
        if (qty > 0) {
            setQty((q) => q - 1)
            onRemove() // 🔥 déclenche animation panier
        }
    }

    return (
        <div className="flex gap-4 bg-white px-4 py-3">
            <img
                src={item.image}
                className="w-20 h-20 rounded-lg object-contain"
            />

            <div className="flex-1">
                <h3 className="font-medium">{item.name}</h3>
                <span className="font-semibold text-primary">
                    {item.price} FCFA
                </span>
            </div>

            <div className="flex items-center gap-2">
                <Button size="icon" variant="outline" onClick={decrement}>
                    −
                </Button>

                <span className="w-6 text-center">{qty}</span>

                <Button size="icon" variant="outline" onClick={increment}>
                    +
                </Button>
            </div>
        </div>
    )
}



export default function TestPage() {
    const [cartCount, setCartCount] = useState(0)

    const incrementCart = () => setCartCount((c) => c + 1)
    const decrementCart = () => setCartCount((c) => (c > 0 ? c - 1 : 0))

    return (
        <div className="min-h-screen bg-gray-50 pb-10">
            <RestaurantHeader count={cartCount} />

            <div className="relative z-10 -mt-16 max-w-4xl mx-auto">
                <RestaurantInfo />

                <div className="mt-6 space-y-8">
                    <MenuSection
                        title="Most Popular"
                        items={[
                            {
                                id: 1,
                                name: "Bistro Flamme Bois",
                                image: "https://img.freepik.com/psd-gratuit/plateau-poulet-roti-delicieux-festin_632498-25445.jpg?semt=ais_hybrid&w=740&q=80",
                                price: 23,
                            },
                            {
                                id: 2,
                                name: "Cottage cheese sizzler",
                                image: "https://img.freepik.com/psd-gratuit/plateau-poulet-roti-delicieux-festin_632498-25445.jpg?semt=ais_hybrid&w=740&q=80",
                                price: 5,
                            },
                        ]}
                        onAdd={incrementCart}
                        onRemove={decrementCart}
                    />

                    <MenuSection
                        title="Starters"
                        items={[
                            {
                                id: 3,
                                name: "Paneer chilli",
                                image: "https://img.freepik.com/psd-gratuit/plateau-poulet-roti-delicieux-festin_632498-25445.jpg?semt=ais_hybrid&w=740&q=80",
                                price: 23,
                            },
                        ]}
                        onAdd={incrementCart}
                        onRemove={decrementCart}
                    />
                </div>
            </div>
        </div>
    )
}
