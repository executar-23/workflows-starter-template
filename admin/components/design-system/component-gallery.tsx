import * as React from "react";

import {
  Bold,
  ChevronsUpDown,
  Italic,
  Mail,
  Search,
  Settings,
  Underline,
} from "lucide-react";
import { useForm } from "react-hook-form";
import { Bar, BarChart, CartesianGrid, XAxis } from "recharts";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { ButtonGroup } from "@/components/ui/button-group";
import { Calendar } from "@/components/ui/calendar";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
} from "@/components/ui/form";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import { Input } from "@/components/ui/input";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import {
  Item,
  ItemContent,
  ItemDescription,
  ItemMedia,
  ItemTitle,
} from "@/components/ui/item";
import { Kbd, KbdGroup } from "@/components/ui/kbd";
import { Label } from "@/components/ui/label";
import {
  Menubar,
  MenubarContent,
  MenubarItem,
  MenubarMenu,
  MenubarTrigger,
} from "@/components/ui/menubar";
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
} from "@/components/ui/sidebar";
import { Skeleton } from "@/components/ui/skeleton";
import { Slider } from "@/components/ui/slider";
import { Spinner } from "@/components/ui/spinner";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Toggle } from "@/components/ui/toggle";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

function Specimen({
  name,
  children,
}: {
  name: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-w-0 flex-col gap-3 rounded-2xl border p-5" data-specimen={name}>
      <p className="text-muted-foreground font-mono text-xs">{name}</p>
      <div className="flex min-w-0 flex-wrap items-center gap-3 overflow-x-auto">{children}</div>
    </div>
  );
}

function Family({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-4">
      <h3 className="text-xl font-medium">{title}</h3>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">{children}</div>
    </section>
  );
}

const chartData = [
  { mes: "Jan", artigos: 2 },
  { mes: "Fev", artigos: 3 },
  { mes: "Mar", artigos: 5 },
  { mes: "Abr", artigos: 4 },
];
const chartConfig = {
  artigos: { label: "Artigos", color: "var(--color-brand-default)" },
} satisfies ChartConfig;

function FormSpecimen() {
  const form = useForm<{ email: string }>({ defaultValues: { email: "" } });
  return (
    <Form {...form}>
      <form className="w-full" onSubmit={(e) => e.preventDefault()}>
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>E-mail</FormLabel>
              <FormControl>
                <Input placeholder="voce@exemplo.com" {...field} />
              </FormControl>
              <FormDescription>Usado apenas para contato.</FormDescription>
            </FormItem>
          )}
        />
      </form>
    </Form>
  );
}

export function ComponentGallery() {
  const [date, setDate] = React.useState<Date | undefined>(new Date(2026, 8, 25));

  return (
    <TooltipProvider>
      <div className="flex flex-col gap-12">
        <Family title="Ações">
          <Specimen name="button · variants">
            <Button>Default</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="outline">Outline</Button>
            <Button variant="ghost">Ghost</Button>
            <Button variant="link">Link</Button>
            <Button variant="destructive">Destructive</Button>
          </Specimen>
          <Specimen name="button · sizes">
            <Button size="sm">Small</Button>
            <Button>Default</Button>
            <Button size="lg">Large</Button>
            <Button size="icon" aria-label="Configurações">
              <Settings />
            </Button>
            <Button disabled>Disabled</Button>
          </Specimen>
          <Specimen name="button-group">
            <ButtonGroup>
              <Button variant="outline">Anterior</Button>
              <Button variant="outline">Próximo</Button>
            </ButtonGroup>
          </Specimen>
          <Specimen name="toggle · toggle-group">
            <Toggle aria-label="Negrito">
              <Bold />
            </Toggle>
            <ToggleGroup type="multiple" variant="outline">
              <ToggleGroupItem value="b" aria-label="Negrito">
                <Bold />
              </ToggleGroupItem>
              <ToggleGroupItem value="i" aria-label="Itálico">
                <Italic />
              </ToggleGroupItem>
              <ToggleGroupItem value="u" aria-label="Sublinhado">
                <Underline />
              </ToggleGroupItem>
            </ToggleGroup>
          </Specimen>
        </Family>

        <Family title="Formulários">
          <Specimen name="input · label · textarea">
            <div className="grid w-full gap-2">
              <Label htmlFor="ds-name">Nome</Label>
              <Input id="ds-name" placeholder="Seu nome" />
              <Textarea placeholder="Mensagem" aria-label="Mensagem" />
            </div>
          </Specimen>
          <Specimen name="input-group">
            <InputGroup>
              <InputGroupAddon>
                <Search />
              </InputGroupAddon>
              <InputGroupInput placeholder="Buscar artigos" aria-label="Buscar artigos" />
            </InputGroup>
          </Specimen>
          <Specimen name="select">
            <Select>
              <SelectTrigger className="w-48" aria-label="Território">
                <SelectValue placeholder="Território" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="riscos">Riscos</SelectItem>
                <SelectItem value="processos">Processos</SelectItem>
                <SelectItem value="ferramentas">Ferramentas</SelectItem>
              </SelectContent>
            </Select>
          </Specimen>
          <Specimen name="checkbox · radio-group · switch">
            <div className="flex items-center gap-2">
              <Checkbox id="ds-check" defaultChecked />
              <Label htmlFor="ds-check">Aceito</Label>
            </div>
            <RadioGroup defaultValue="a" className="flex">
              <div className="flex items-center gap-2">
                <RadioGroupItem value="a" id="ds-ra" />
                <Label htmlFor="ds-ra">A</Label>
              </div>
              <div className="flex items-center gap-2">
                <RadioGroupItem value="b" id="ds-rb" />
                <Label htmlFor="ds-rb">B</Label>
              </div>
            </RadioGroup>
            <div className="flex items-center gap-2">
              <Switch id="ds-switch" defaultChecked />
              <Label htmlFor="ds-switch">Ativo</Label>
            </div>
          </Specimen>
          <Specimen name="slider · input-otp">
            <Slider defaultValue={[40]} max={100} className="w-40" aria-label="Volume" />
            <InputOTP maxLength={4} aria-label="Código">
              <InputOTPGroup>
                <InputOTPSlot index={0} />
                <InputOTPSlot index={1} />
                <InputOTPSlot index={2} />
                <InputOTPSlot index={3} />
              </InputOTPGroup>
            </InputOTP>
          </Specimen>
          <Specimen name="field">
            <FieldGroup className="w-full">
              <Field>
                <FieldLabel htmlFor="ds-field">Título do artigo</FieldLabel>
                <Input id="ds-field" />
                <FieldDescription>Até 70 caracteres.</FieldDescription>
              </Field>
            </FieldGroup>
          </Specimen>
          <Specimen name="form (react-hook-form)">
            <FormSpecimen />
          </Specimen>
        </Family>

        <Family title="Exibição">
          <Specimen name="card">
            <Card className="w-full">
              <CardHeader>
                <CardTitle>Riscos Cognitivos</CardTitle>
                <CardDescription>Reconhecer a exposição</CardDescription>
              </CardHeader>
              <CardContent className="text-muted-foreground text-sm">
                Definições, fatores, sinais e consequências.
              </CardContent>
              <CardFooter>
                <Button size="sm">Ler</Button>
              </CardFooter>
            </Card>
          </Specimen>
          <Specimen name="badge · avatar · kbd">
            <Badge>Default</Badge>
            <Badge variant="secondary">Secondary</Badge>
            <Badge variant="outline">Outline</Badge>
            <Badge variant="destructive">Destructive</Badge>
            <Avatar>
              <AvatarImage src="/design-system/avatar1.png" alt="" />
              <AvatarFallback>RC</AvatarFallback>
            </Avatar>
            <KbdGroup>
              <Kbd>Ctrl</Kbd>
              <Kbd>K</Kbd>
            </KbdGroup>
          </Specimen>
          <Specimen name="table">
            <Table>
              <TableCaption>Pilares e níveis</TableCaption>
              <TableHeader>
                <TableRow>
                  <TableHead>Pilar</TableHead>
                  <TableHead>Descoberta</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell>Riscos</TableCell>
                  <TableCell>Reconhecer sinais</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Processos</TableCell>
                  <TableCell>Perceber barreiras</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </Specimen>
          <Specimen name="skeleton · spinner · progress">
            <div className="flex w-full flex-col gap-2">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </div>
            <Spinner />
            <Progress value={60} className="w-40" aria-label="Progresso" />
          </Specimen>
          <Specimen name="empty">
            <Empty className="w-full border">
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <Mail />
                </EmptyMedia>
                <EmptyTitle>Nenhum artigo</EmptyTitle>
                <EmptyDescription>Os rascunhos aparecem aqui.</EmptyDescription>
              </EmptyHeader>
            </Empty>
          </Specimen>
          <Specimen name="item">
            <Item variant="outline" className="w-full">
              <ItemMedia variant="icon">
                <Mail />
              </ItemMedia>
              <ItemContent>
                <ItemTitle>Novo artigo publicado</ItemTitle>
                <ItemDescription>Do risco cognitivo à execução assistida</ItemDescription>
              </ItemContent>
            </Item>
          </Specimen>
          <Specimen name="alert (system messages)">
            <Alert>
              <AlertTitle>Alerta de sistema</AlertTitle>
              <AlertDescription>
                Para destaques editoriais use Callout (DS-CALLOUT-001).
              </AlertDescription>
            </Alert>
          </Specimen>
          <Specimen name="chart">
            <ChartContainer config={chartConfig} className="h-40 w-full">
              <BarChart data={chartData}>
                <CartesianGrid vertical={false} />
                <XAxis dataKey="mes" tickLine={false} axisLine={false} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="artigos" fill="var(--color-artigos)" radius={6} />
              </BarChart>
            </ChartContainer>
          </Specimen>
        </Family>

        <Family title="Navegação">
          <Specimen name="breadcrumb">
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbLink href="/blog">Blog</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage>Artigo</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </Specimen>
          <Specimen name="tabs">
            <Tabs defaultValue="riscos" className="w-full">
              <TabsList>
                <TabsTrigger value="riscos">Riscos</TabsTrigger>
                <TabsTrigger value="processos">Processos</TabsTrigger>
              </TabsList>
              <TabsContent value="riscos" className="text-muted-foreground text-sm">
                Reconhecer a exposição.
              </TabsContent>
              <TabsContent value="processos" className="text-muted-foreground text-sm">
                Redesenhar o trabalho.
              </TabsContent>
            </Tabs>
          </Specimen>
          <Specimen name="pagination">
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious href="#" />
                </PaginationItem>
                <PaginationItem>
                  <PaginationLink href="#" isActive>
                    1
                  </PaginationLink>
                </PaginationItem>
                <PaginationItem>
                  <PaginationLink href="#">2</PaginationLink>
                </PaginationItem>
                <PaginationItem>
                  <PaginationNext href="#" />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </Specimen>
          <Specimen name="navigation-menu · menubar">
            <NavigationMenu>
              <NavigationMenuList>
                <NavigationMenuItem>
                  <NavigationMenuLink href="/blog" className={navigationMenuTriggerStyle()}>
                    Blog
                  </NavigationMenuLink>
                </NavigationMenuItem>
              </NavigationMenuList>
            </NavigationMenu>
            <Menubar>
              <MenubarMenu>
                <MenubarTrigger>Arquivo</MenubarTrigger>
                <MenubarContent>
                  <MenubarItem>Novo artigo</MenubarItem>
                  <MenubarItem>Publicar</MenubarItem>
                </MenubarContent>
              </MenubarMenu>
            </Menubar>
          </Specimen>
          <Specimen name="sidebar (collapsible=none)">
            <SidebarProvider className="min-h-0 w-full">
              <Sidebar collapsible="none" className="h-auto w-full rounded-xl border">
                <SidebarContent>
                  <SidebarGroup>
                    <SidebarGroupLabel>Painel</SidebarGroupLabel>
                    <SidebarMenu>
                      <SidebarMenuItem>
                        <SidebarMenuButton isActive>Blog</SidebarMenuButton>
                      </SidebarMenuItem>
                      <SidebarMenuItem>
                        <SidebarMenuButton>Design System</SidebarMenuButton>
                      </SidebarMenuItem>
                    </SidebarMenu>
                  </SidebarGroup>
                </SidebarContent>
              </Sidebar>
            </SidebarProvider>
          </Specimen>
        </Family>

        <Family title="Sobreposições">
          <Specimen name="dialog · alert-dialog">
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline">Abrir dialog</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Publicar artigo</DialogTitle>
                  <DialogDescription>O artigo ficará visível no blog.</DialogDescription>
                </DialogHeader>
                <DialogFooter>
                  <Button>Publicar</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline">Abrir alert-dialog</Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Excluir rascunho?</AlertDialogTitle>
                  <AlertDialogDescription>Esta ação não pode ser desfeita.</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction>Excluir</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </Specimen>
          <Specimen name="sheet · drawer">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline">Abrir sheet</Button>
              </SheetTrigger>
              <SheetContent>
                <SheetHeader>
                  <SheetTitle>Filtros</SheetTitle>
                  <SheetDescription>Refine os artigos.</SheetDescription>
                </SheetHeader>
              </SheetContent>
            </Sheet>
            <Drawer>
              <DrawerTrigger asChild>
                <Button variant="outline">Abrir drawer</Button>
              </DrawerTrigger>
              <DrawerContent>
                <DrawerHeader>
                  <DrawerTitle>Compartilhar</DrawerTitle>
                  <DrawerDescription>Copie o link do artigo.</DrawerDescription>
                </DrawerHeader>
              </DrawerContent>
            </Drawer>
          </Specimen>
          <Specimen name="popover · hover-card · tooltip">
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline">Popover</Button>
              </PopoverTrigger>
              <PopoverContent className="text-sm">Conteúdo auxiliar.</PopoverContent>
            </Popover>
            <HoverCard>
              <HoverCardTrigger asChild>
                <Button variant="link">@riscocognitivo</Button>
              </HoverCardTrigger>
              <HoverCardContent className="text-sm">Blog editorial.</HoverCardContent>
            </HoverCard>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline">Tooltip</Button>
              </TooltipTrigger>
              <TooltipContent>Dica curta</TooltipContent>
            </Tooltip>
          </Specimen>
          <Specimen name="dropdown-menu · context-menu">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline">Dropdown</Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuLabel>Artigo</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem>Editar</DropdownMenuItem>
                <DropdownMenuItem>Duplicar</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <ContextMenu>
              <ContextMenuTrigger className="text-muted-foreground rounded-md border border-dashed px-4 py-3 text-sm">
                Clique com o botão direito
              </ContextMenuTrigger>
              <ContextMenuContent>
                <ContextMenuItem>Copiar link</ContextMenuItem>
              </ContextMenuContent>
            </ContextMenu>
          </Specimen>
          <Specimen name="command">
            <Command className="w-full rounded-lg border">
              <CommandInput placeholder="Buscar comando..." />
              <CommandList>
                <CommandEmpty>Nada encontrado.</CommandEmpty>
                <CommandGroup heading="Sugestões">
                  <CommandItem>Novo artigo</CommandItem>
                  <CommandItem>Abrir painel</CommandItem>
                </CommandGroup>
              </CommandList>
            </Command>
          </Specimen>
        </Family>

        <Family title="Estrutura e conteúdo">
          <Specimen name="accordion">
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="a">
                <AccordionTrigger>O que é risco cognitivo?</AccordionTrigger>
                <AccordionContent>Uma lente para investigar o trabalho.</AccordionContent>
              </AccordionItem>
            </Accordion>
          </Specimen>
          <Specimen name="collapsible">
            <Collapsible className="w-full">
              <CollapsibleTrigger asChild>
                <Button variant="ghost" size="sm">
                  Referências <ChevronsUpDown />
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="text-muted-foreground mt-2 text-sm">
                GOV.UK · Nielsen Norman Group
              </CollapsibleContent>
            </Collapsible>
          </Specimen>
          <Specimen name="calendar">
            <Calendar mode="single" selected={date} onSelect={setDate} className="rounded-lg border" />
          </Specimen>
          <Specimen name="carousel">
            <Carousel className="mx-auto w-3/4">
              <CarouselContent>
                {["/design-system/1.webp", "/design-system/2.webp", "/design-system/3.webp"].map((src) => (
                  <CarouselItem key={src}>
                    <img src={src} alt="" className="aspect-video w-full rounded-xl object-cover" />
                  </CarouselItem>
                ))}
              </CarouselContent>
              <CarouselPrevious />
              <CarouselNext />
            </Carousel>
          </Specimen>
          <Specimen name="resizable">
            <ResizablePanelGroup direction="horizontal" className="min-h-24 w-full rounded-lg border">
              <ResizablePanel defaultSize={50} className="grid place-items-center text-sm">
                Painel A
              </ResizablePanel>
              <ResizableHandle withHandle />
              <ResizablePanel defaultSize={50} className="grid place-items-center text-sm">
                Painel B
              </ResizablePanel>
            </ResizablePanelGroup>
          </Specimen>
          <Specimen name="scroll-area · separator · aspect-ratio">
            <ScrollArea className="h-24 w-40 rounded-md border p-3 text-sm">
              {Array.from({ length: 8 }, (_, i) => (
                <p key={i}>Item {i + 1}</p>
              ))}
            </ScrollArea>
            <Separator orientation="vertical" className="h-16" />
            <div className="w-32">
              <AspectRatio ratio={4 / 5}>
                <img
                  src="/design-system/hero.jpg"
                  alt=""
                  className="size-full rounded-xl object-cover"
                />
              </AspectRatio>
            </div>
          </Specimen>
        </Family>
      </div>
    </TooltipProvider>
  );
}
