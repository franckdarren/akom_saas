import { cn } from '@/lib/utils'
import {
  Card,
  CardHeader,
  CardContent,
  CardFooter,
  CardTitle,
  CardDescription,
  CardAction,
} from '@/components/ui/card'
import { cva, type VariantProps } from 'class-variance-authority'

const appCardVariants = cva('', {
  variants: {
    variant: {
      default: '',
      flat: 'shadow-none',
      stat: 'shadow-none hover:shadow-sm transition-shadow',
      pricing: 'shadow-none border-2',
    },
  },
  defaultVariants: {
    variant: 'default',
  },
})

interface AppCardProps
  extends React.ComponentProps<typeof Card>,
    VariantProps<typeof appCardVariants> {}

function AppCard({ className, variant, ...props }: AppCardProps) {
  return (
    <Card
      className={cn(appCardVariants({ variant }), className)}
      {...props}
    />
  )
}

export {
  AppCard,
  CardHeader,
  CardContent,
  CardFooter,
  CardTitle,
  CardDescription,
  CardAction,
}
