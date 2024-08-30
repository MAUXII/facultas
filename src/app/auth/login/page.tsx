'use client'
import { FaGithub, FaGoogle } from "react-icons/fa";

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"

import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { useToast } from "@/components/ui/use-toast"
import Image from "next/image"
import Link from "next/link"
import { ToastAction } from "@/components/ui/toast"
import firebase from "firebase/compat/app";
import { useRouter } from "next/navigation";
import { auth } from "../../firebase";
import { signInWithEmailAndPassword } from "firebase/auth";
import { githubProvider, googleProvider, signInWithPopup } from "../../firebase";

const FormSchema = z.object({
  email: z.string()
  .min(1,"Email é um campo obrigatório")
  .email("Este não é um Email Válido")
  ,

password: z.string()
.min(6,"A senha deve ter pelo menos 6 caracteres")
,
  })
   

export default function Login(){
  const router = useRouter();

    // eslint-disable-next-line react-hooks/rules-of-hooks
    const form = useForm<z.infer<typeof FormSchema>>({
        resolver: zodResolver(FormSchema),
        defaultValues: {
          email: "",
          password: "",
        },
      })

      function onSubmit(data: z.infer<typeof FormSchema>) {
        
      const emailInput = document.getElementById("email-login") as HTMLInputElement;
      const passwordInput = document.getElementById("password-login") as HTMLInputElement;
      const email = emailInput.value;
      const password = passwordInput.value;

        signInWithEmailAndPassword(auth, email,password)
        .then((userCredential)=>{
          const user = userCredential.user;
          

          toast({
            title: `Login realizado com sucesso`,
            description: `Bem-vindo, ${user.displayName}`,
          });

          router.push('/')
        })

        .catch((error) =>{
          const errorCode = error.code;
          const errorMessage = error.message;
          toast({
            variant: "destructive",
            title: "Erro ao fazer login:",
            description: `${errorMessage} e ${errorCode}`,
          });
          
        })
        
      
      }

      
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const { toast } = useToast()

  const handleGithubLogin = () => {
    signInWithPopup(auth, githubProvider)
      .then((result) => {
        // Sucesso no login com GitHub
        toast({
          title: `Login realizado com sucesso`,
          description: `Bem-vindo, ${result.user.displayName}`,
        });
        router.push('/');
      })
      .catch((error) => {
        toast({
          variant: "destructive",
          title: "Erro ao fazer login com GitHub:",
          description: error.message,
        });
      });
  };

  const handleGoogleLogin = () => {
    signInWithPopup(auth, googleProvider)
      .then((result) => {
        // Sucesso no login com Google
        toast({
          title: `Login realizado com sucesso`,
          description: `Bem-vindo, ${result.user.displayName}`,
        });
        router.push('/');
      })
      .catch((error) => {
        toast({
          variant: "destructive",
          title: "Erro ao fazer login com Google:",
          description: error.message,
        });
      });
  };

      return (
        <main className="flex w-full min-h-screen items-center justify-center p-4 px-8">
          <section className="w-full flex items-center justify-center">
            <div className="w-full max-w-[600px] flex flex-col justify-center gap-6">
              <div className="flex flex-col gap-4">
                
        <div className="flex flex-row gap-4 items-center">
        <Image src="/logo.svg" height={20} width={20} alt="" className=" w-14 aspect-square"/>
        <h1 className="font-bold [font-size:_clamp(1em,10vw,3em)] ">PRTrack</h1>
        </div>
        <p className="text-[#B1B1B1] hidden text-sm max-w-[450px]">Conheça o PRTrack: o aplicativo web que modernizou a gestão de presença na FATEC, substituindo as listas físicas por uma solução digital eficiente.</p>
        </div>
        <div className="flex justify-center flex-col gap-4 md:ring-1 border-white/20 border-y md:border-y-0 md:rounded-lg ring-white/20 md:px-8 py-8">
          <div className="flex flex-col gap-1">
          <h2 className=" flex items-center gap-2 font-semibold text-3xl">Entre com sua conta <a className="mt-[] text-xl">🎪</a></h2>
          <p className="text-sm text-[#B1B1B1]">Entre com uma conta e retome sua jornada com PRTrack!</p>
          </div>
          <div className="flex w-full flex-wrap gap-2">
          <Button onClick={handleGithubLogin} className="flex-grow h-12 min-w-20 hover:dark:bg-[#0e0e0e] ring-1 ring-white/20 dark:text-white dark:bg-black flex items-center justify-center gap-4">
                <FaGithub className="text-xl" />
                Login com GitHub
              </Button>
              <Button onClick={handleGoogleLogin} className="flex-grow h-12 min-w-20 hover:dark:bg-[#0e0e0e] ring-1 ring-white/20 dark:text-white dark:bg-black flex items-center justify-center gap-4">
                <FaGoogle className="text-xl" />
                Login com Google
              </Button>
</div>
          <div className="flex items-center justify-center mt-2 w-full gap-2">
            <div className="w-full h-[1px] bg-white/20"></div>
            <p className="text-sm font-normal px-2 text-[#B1B1B1] uppercase text-nowrap">Ou continue com</p>
            <div className="w-full h-[1px] bg-white/20"></div>
          </div>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="w-full gap-2 flex-col flex">
           
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem className="w-full">
                  <FormLabel className="">Email</FormLabel>
                  <FormControl>
                    <Input id="email-login" className="w-full flex" placeholder="m@example.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
           
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="">Senha</FormLabel>
                  <FormControl>
                    <Input id="password-login" type="password" className="w-full flex" placeholder="*******" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button className="mt-6 h-12" type="submit">Entrar</Button>
          </form>
        </Form>
        </div>
        <a className="flex flex-row text-sm font-normal w-full text-center gap-2 self-center items-center justify-center">Não possui login? <Link className="underline font-medium" href="/auth/cadastro">Faça o cadastro</Link></a>
        </div>
        </section>
        </main>
      )
}

