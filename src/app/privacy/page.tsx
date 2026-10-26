import type { Metadata } from "next";
import { LegalSection, LegalShell } from "@/components/legal/legal-shell";
import { APP_NAME } from "@/lib/brand";

export const metadata: Metadata = {
  title: `Privacidade · ${APP_NAME}`,
  description: `Política de Privacidade do ${APP_NAME}.`,
};

export default function PrivacyPage() {
  return (
    <LegalShell title="Privacidade" updated="22 de setembro de 2026">
      <LegalSection title="1. Quem somos">
        <p>
          O {APP_NAME} é um hub acadêmico open source para comunidades de
          faculdade (turma, grupo, monitoria e evento), grade da turma e
          calendário pessoal. Esta política descreve quais dados tratamos e
          para quê.
        </p>
      </LegalSection>

      <LegalSection title="2. Dados que coletamos">
        <p>Podemos tratar:</p>
        <ul className="list-disc space-y-2 pl-5 text-white/65">
          <li>
            Conta: nome, e-mail, senha (hash), username, foto de perfil e
            instituição informada por você.
          </li>
          <li>
            Conteúdo que você cria: comunidades, grade, eventos e demais dados
            do hub.
          </li>
          <li>
            Autenticação com Google, quando você escolhe entrar com a conta
            Google.
          </li>
          <li>
            Link secreto de assinatura do calendário (token), se você ativar a
            sincronização com Google Calendar, Apple Calendar ou outro app
            compatível.
          </li>
          <li>
            Dados técnicos básicos de uso (logs de erro, IP em infraestrutura
            do provedor) para manter o serviço estável e seguro.
          </li>
        </ul>
      </LegalSection>

      <LegalSection title="3. Como usamos">
        <p>Usamos os dados para:</p>
        <ul className="list-disc space-y-2 pl-5 text-white/65">
          <li>criar e manter sua conta;</li>
          <li>operar comunidades, grade e calendário;</li>
          <li>
            publicar um feed de calendário (ICS) com seus eventos, somente se
            você gerar o link de assinatura;
          </li>
          <li>prevenir abuso, corrigir falhas e melhorar o produto.</li>
        </ul>
        <p>Não vendemos seus dados.</p>
      </LegalSection>

      <LegalSection title="4. Assinatura de calendário">
        <p>
          Se você sincronizar o calendário, geramos um link secreto (feed ICS)
          que apps como Google Calendar ou Apple Calendar podem assinar. Quem
          tiver o link consegue ler seus eventos do {APP_NAME}. Não pedimos
          acesso de escrita à sua conta Google ou Apple. Você pode gerar um
          link novo a qualquer momento no app; o link antigo deixa de funcionar.
        </p>
      </LegalSection>

      <LegalSection title="5. Compartilhamento">
        <p>
          Dados podem ser processados por provedores necessários ao funcionamento
          do app (hospedagem, autenticação e banco — hoje tipicamente Vercel e
          Supabase). Eles atuam sob contrato e apenas para prestar o serviço.
          Podemos divulgar dados se a lei exigir.
        </p>
      </LegalSection>

      <LegalSection title="6. Retenção e exclusão">
        <p>
          Mantemos os dados enquanto sua conta existir ou enquanto forem
          necessários ao serviço. Você pode pedir exclusão da conta e dos dados
          associados pelos canais de contato abaixo.
        </p>
      </LegalSection>

      <LegalSection title="7. Seus direitos">
        <p>
          Nos termos da LGPD, você pode solicitar acesso, correção, portabilidade
          ou exclusão dos seus dados pessoais, além de informações sobre o
          tratamento. Fale conosco pelo contato indicado.
        </p>
      </LegalSection>

      <LegalSection title="8. Contato">
        <p>
          Dúvidas sobre privacidade: abra um issue no repositório do {APP_NAME}{" "}
          ou fale com os mantenedores do projeto.
        </p>
      </LegalSection>
    </LegalShell>
  );
}
