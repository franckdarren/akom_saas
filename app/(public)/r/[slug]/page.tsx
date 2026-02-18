"use client"

import {useState, useMemo} from "react"
import {Button} from "@/components/ui/button"
import {Card, CardContent} from "@/components/ui/card"
import {Badge} from "@/components/ui/badge"
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
} from "@/components/ui/sheet"
import {Separator} from "@/components/ui/separator"
import {ScrollArea} from "@/components/ui/scroll-area"
import {ShoppingCart} from "lucide-react"

type Product = {
    id: number
    name: string
    description?: string
    price: number
    available: boolean
}

const products: Product[] = [
    {
        id: 1,
        name: "Poulet Braisé",
        description: "Servi avec alloco et piment maison",
        price: 8500,
        available: true,
    },
    {
        id: 2,
        name: "Poisson Grillé",
        description: "Capitaine frais sauce tomate",
        price: 12000,
        available: true,
    },
    {
        id: 3,
        name: "Attiéké Poulet",
        price: 7000,
        available: false,
    },
]

export default function RestaurantMenu() {
    const [cart, setCart] = useState<Record<number, number>>({})
    const [open, setOpen] = useState(false)

    const formatPrice = (price: number) =>
        new Intl.NumberFormat("fr-FR").format(price) + " FCFA"

    const addToCart = (id: number) => {
        setCart((prev) => ({
            ...prev,
            [id]: (prev[id] || 0) + 1,
        }))
    }

    const removeFromCart = (id: number) => {
        setCart((prev) => {
            const updated = {...prev}
            if (updated[id] > 1) {
                updated[id] -= 1
            } else {
                delete updated[id]
            }
            return updated
        })
    }

    const cartItems = useMemo(() => {
        return products
            .filter((p) => cart[p.id])
            .map((p) => ({
                ...p,
                qty: cart[p.id],
            }))
    }, [cart])

    const total = useMemo(() => {
        return cartItems.reduce((sum, item) => sum + item.price * item.qty, 0)
    }, [cartItems])

    const totalItems = Object.values(cart).reduce((a, b) => a + b, 0)

    return (
        <div className="min-h-screen bg-background text-foreground">
            {/* Header */}
            <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur">
                <div className="container mx-auto flex items-center justify-between p-4">
                    <h1 className="text-xl font-bold">Mon Restaurant</h1>

                    <Button
                        variant="outline"
                        size="icon"
                        className="relative"
                        onClick={() => setOpen(true)}
                    >
                        <ShoppingCart className="h-5 w-5"/>
                        {totalItems > 0 && (
                            <Badge className="absolute -top-2 -right-2 h-5 px-1.5 text-xs">
                                {totalItems}
                            </Badge>
                        )}
                    </Button>
                </div>
            </header>

            {/* Products Grid */}
            <main className="container mx-auto p-4">
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {products.map((product) => {
                        const qty = cart[product.id] || 0

                        return (
                            <Card
                                key={product.id}
                                className="transition hover:shadow-lg"
                            >
                                <CardContent className="p-4 flex flex-col gap-3">
                                    <div>
                                        <div className="flex items-center justify-between">
                                            <h3 className="font-semibold text-base">
                                                {product.name}
                                            </h3>

                                            {!product.available && (
                                                <Badge variant="destructive">
                                                    Épuisé
                                                </Badge>
                                            )}
                                        </div>

                                        {product.description && (
                                            <p className="text-sm text-muted-foreground mt-1">
                                                {product.description}
                                            </p>
                                        )}
                                    </div>

                                    <div className="flex items-center justify-between mt-auto">
                    <span className="font-bold text-primary">
                      {formatPrice(product.price)}
                    </span>

                                        {product.available && (
                                            <div className="flex items-center gap-2">
                                                {qty > 0 ? (
                                                    <>
                                                        <Button
                                                            size="icon"
                                                            variant="outline"
                                                            onClick={() =>
                                                                removeFromCart(product.id)
                                                            }
                                                        >
                                                            −
                                                        </Button>

                                                        <span className="w-6 text-center font-semibold">
                              {qty}
                            </span>

                                                        <Button
                                                            size="icon"
                                                            onClick={() =>
                                                                addToCart(product.id)
                                                            }
                                                        >
                                                            +
                                                        </Button>
                                                    </>
                                                ) : (
                                                    <Button
                                                        size="sm"
                                                        onClick={() =>
                                                            addToCart(product.id)
                                                        }
                                                    >
                                                        Ajouter
                                                    </Button>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        )
                    })}
                </div>
            </main>

            {/* Cart Sheet */}
            <Sheet open={open} onOpenChange={setOpen}>
                <SheetContent
                    side="right"
                    className="w-full sm:max-w-md flex flex-col"
                >
                    <SheetHeader>
                        <SheetTitle>Mon Panier</SheetTitle>
                    </SheetHeader>

                    <Separator className="my-4"/>

                    {cartItems.length === 0 ? (
                        <p className="text-sm text-muted-foreground">
                            Votre panier est vide.
                        </p>
                    ) : (
                        <>
                            <ScrollArea className="flex-1 pr-4">
                                <div className="space-y-4">
                                    {cartItems.map((item) => (
                                        <div
                                            key={item.id}
                                            className="flex justify-between items-center"
                                        >
                                            <div>
                                                <p className="font-medium text-sm">
                                                    {item.name}
                                                </p>
                                                <p className="text-xs text-muted-foreground">
                                                    {formatPrice(item.price)}
                                                </p>
                                            </div>

                                            <div className="flex items-center gap-2">
                                                <Button
                                                    size="icon"
                                                    variant="outline"
                                                    onClick={() =>
                                                        removeFromCart(item.id)
                                                    }
                                                >
                                                    −
                                                </Button>

                                                <span className="w-6 text-center font-semibold">
                          {item.qty}
                        </span>

                                                <Button
                                                    size="icon"
                                                    onClick={() =>
                                                        addToCart(item.id)
                                                    }
                                                >
                                                    +
                                                </Button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </ScrollArea>

                            <Separator className="my-4"/>

                            <div className="flex justify-between font-semibold text-lg">
                                <span>Total</span>
                                <span>{formatPrice(total)}</span>
                            </div>

                            <Button className="w-full mt-4">
                                Valider la commande
                            </Button>
                        </>
                    )}
                </SheetContent>
            </Sheet>
        </div>
    )
}
