import type { Metadata } from "next";
import { LegalSection, LegalShell } from "@/components/legal/legal-shell";
import { APP_NAME } from "@/lib/brand";

export const metadata: Metadata = {
  title: `Termos · ${APP_NAME}`,
  description: `Termos de Serviço do ${APP_NAME}.`,
};

export default function TermsPage() {
  return (
    <LegalShell title="Termos" updated="20 de setembro de 2026">
      <LegalSection title="1. Aceite">
        <p>
          Ao usar o {APP_NAME}, você concorda com estes Termos. Se não
          concordar, não use o serviço.
        </p>
      </LegalSection>

      <LegalSection title="2. O serviço">
        <p>
          O {APP_NAME} é um hub acadêmico para organizar comunidades de
          faculdade, grade da turma e calendário pessoal. O produto é oferecido
          “como está”, em evolução contínua, e pode mudar ou ficar
          temporariamente indisponível.
        </p>
      </LegalSection>

      <LegalSection title="3. Conta">
        <p>
          Você é responsável pelas informações da conta, pela segurança da
          senha e por tudo que acontecer sob seu login. Use um e-mail válido e
          não compartilhe acesso.
        </p>
      </LegalSection>

      <LegalSection title="4. Uso aceitável">
        <p>Você se compromete a não:</p>
        <ul className="list-disc space-y-2 pl-5 text-white/65">
          <li>violar lei, direitos de terceiros ou políticas acadêmicas;</li>
          <li>assediar, discriminar ou publicar conteúdo ilegal;</li>
          <li>tentar invadir, sobrecarregar ou quebrar o serviço;</li>
          <li>
            usar integrações (como Google Calendar) de forma abusiva ou fora do
            que foi autorizado.
          </li>
        </ul>
        <p>
          Podemos suspender ou encerrar contas que violem estes Termos.
        </p>
      </LegalSection>

      <LegalSection title="5. Conteúdo">
        <p>
          Você mantém os direitos sobre o conteúdo que cria. Ao publicar no{" "}
          {APP_NAME}, você nos autoriza a hospedar e exibir esse conteúdo para
          operar o serviço (por exemplo, mostrar a grade aos membros da
          comunidade).
        </p>
      </LegalSection>

      <LegalSection title="6. Integrações de terceiros">
        <p>
          Recursos como login Google e Google Calendar dependem de serviços de
          terceiros. O uso desses recursos também está sujeito aos termos e
          políticas do provedor correspondente.
        </p>
      </LegalSection>

      <LegalSection title="7. Sem garantias">
        <p>
          Não garantimos disponibilidade ininterrupta, ausência de erros ou
          adequação a um fim específico. Em especial, o {APP_NAME} não substitui
          sistemas oficiais da instituição (SIGA, AVA, portal do aluno etc.).
        </p>
      </LegalSection>

      <LegalSection title="8. Limitação de responsabilidade">
        <p>
          Na medida permitida pela lei, o {APP_NAME} e seus mantenedores não
          respondem por danos indiretos, lucros cessantes ou perda de dados
          decorrentes do uso ou da impossibilidade de uso do serviço.
        </p>
      </LegalSection>

      <LegalSection title="9. Alterações">
        <p>
          Podemos atualizar estes Termos. A data no topo da página indica a
          versão vigente. O uso contínuo após a alteração significa aceite da
          nova versão.
        </p>
      </LegalSection>

      <LegalSection title="10. Contato">
        <p>
          Dúvidas sobre estes Termos: abra um issue no repositório do {APP_NAME}{" "}
          ou fale com os mantenedores do projeto.
        </p>
      </LegalSection>
    </LegalShell>
  );
}
