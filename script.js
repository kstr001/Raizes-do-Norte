function irParaTela(id) {
  mostrarLoading();

  setTimeout(() => {
    document.querySelectorAll('[id^="tela"]').forEach(t => t.classList.add('hidden'));
    
    document.getElementById(id).classList.remove('hidden');

    const menu = document.getElementById('menuTopo');

    if (id === 'tela1' || id === 'telaCadastro') {
      menu.classList.add('hidden'); 
    } else {
      menu.classList.remove('hidden'); 
    }

    esconderLoading();
  }, 800);
}

function mostrarModal(msg, mostrarBotaoOk = true) {
  document.getElementById('modalMsg').innerHTML = msg;
  
  const btnOk = document.getElementById('btnModalOk');
  
  if (mostrarBotaoOk) {
    btnOk.classList.remove('hidden'); 
  } else {
    btnOk.classList.add('hidden');  
  }
  
  document.getElementById('modal').style.display = 'block';
}

function fecharModal() {
  document.getElementById('modal').style.display = 'none';
}

function login() {
  const userDigitado = document.getElementById('usuario').value;
  const passDigitado = document.getElementById('senha').value;
  const unidade = document.getElementById('unidade').value;

  if (!userDigitado || !passDigitado || !unidade) {
    mostrarModal('Preencha todos os campos');
    return;
  }

  const usuarioEncontrado = usuariosCadastrados.find(u => 
    u.user === userDigitado && u.pass === passDigitado
  );

  if (usuarioEncontrado) {
    document.getElementById('menuTopo').classList.remove('hidden');
    document.querySelector('#telaHome h1').innerText = `Bem-vindo, ${usuarioEncontrado.nome} 👋`;
    irParaTela('telaHome');
  } else {
    mostrarModal('Usuário ou senha incorretos');
  }
}

function salvarCadastro() {
  const nomeInput = document.getElementById('cadNome');
  const userInput = document.getElementById('cadUsuario');
  const senhaInput = document.getElementById('cadSenha');

  if (!nomeInput.value || !userInput.value || !senhaInput.value) {
    mostrarModal('Preencha todos os campos!');
    return;
  }

  usuariosCadastrados.push({ 
    nome: nomeInput.value, 
    user: userInput.value, 
    pass: senhaInput.value 
  });

  nomeInput.value = '';
  userInput.value = '';
  senhaInput.value = '';

  mostrarModal('Cadastro realizado com sucesso!');
  irParaTela('tela1');
}

let pedidosAtivos = [];
let carrinho = [];
let produtoSelecionado = null;
let total = 0;
let segundosRestantesGeral = 0; 
let intervaloContador = null;
let usuariosCadastrados = [
  { user: 'admin', pass: '123', nome: 'Administrador' }
];
let motorRodando = false;

function adicionarCarrinho() {
  if (!produtoSelecionado) {
    mostrarModal('Selecione um produto');
    return;
  }

  carrinho.push(produtoSelecionado);
  total += produtoSelecionado.preco;

  renderCarrinho();

  irParaTela('tela3');
}

function renderCarrinho() {
  const lista = document.getElementById('listaCarrinho');
  lista.innerHTML = '';

  carrinho.forEach((item, index) => {
    const div = document.createElement('div');
    div.innerHTML = `${item.nome} - R$${item.preco} <button onclick="removerItem(${index})">Remover</button>`;
    lista.appendChild(div);
  });

  document.getElementById('total').innerText = total;
}

function removerItem(index) {
  total -= carrinho[index].preco;
  carrinho.splice(index, 1);
  renderCarrinho();
}

function irParaPagamento() {
  if (carrinho.length === 0) {
    mostrarModal('Carrinho vazio');
    return;
  }

  document.getElementById('totalPagamento').innerText = total;
  irParaTela('tela4');
}

function solicitarPagamento() {
  const resultado = document.getElementById('resultado');
  const botao = event.currentTarget;

  botao.disabled = true;

  resultado.className = 'mensagem';
  resultado.innerText = 'Processando pagamento...';

  setTimeout(() => {
    const sucesso = Math.random() < 0.5;

    if (sucesso) {
        resultado.className = 'mensagem aprovado';
        resultado.innerText = 'Pagamento aprovado!';

       
        const tempoProduto = carrinho.reduce((acc, item) => acc + item.tempo, 0);
        const tempoEntrega = getTempoEntrega();
        const tempoTotal = (tempoProduto + tempoEntrega) * 60; 

       
        const novoPedido = {
            id: Date.now(), 
            itens: [...carrinho], 
            segundosRestantes: tempoTotal
        };

        pedidosAtivos.push(novoPedido);
        
    
        iniciarMotorDePreparo();

        limparCarrinho();
        botao.disabled = false;

        setTimeout(() => {
            irParaTela('tela5');
        }, 1500);
    } else {
      resultado.className = 'mensagem negado';
      resultado.innerText = 'Pagamento negado!';
      botao.disabled = false;
    }
  }, 3000);
}

function iniciarMotorDePreparo() {
    if (motorRodando) return; 
    motorRodando = true;

    setInterval(() => {
        pedidosAtivos.forEach(pedido => {
            if (pedido.segundosRestantes > 0) {
                pedido.segundosRestantes--;
            }
        });
        renderizarPedidosAtivos();
    }, 1000);
}

function renderizarPedidosAtivos() {
    const container = document.getElementById('tela5'); 
    container.innerHTML = '<h1>Pedidos em Preparação</h1>';

    pedidosAtivos.forEach((pedido, index) => {
        const minutos = Math.floor(pedido.segundosRestantes / 60);
        const segundos = pedido.segundosRestantes % 60;
        const tempoFormatado = pedido.segundosRestantes > 0 
            ? `${minutos}:${segundos.toString().padStart(2, '0')}` 
            : "✅ Pronto!";

        const card = document.createElement('div');
        card.className = 'card';
        card.innerHTML = `
            <p><strong>Pedido #${index + 1}</strong></p>
            <p>Itens: ${pedido.itens.map(i => i.nome).join(', ')}</p>
            <p>Tempo estimado: <strong>${tempoFormatado}</strong></p>
        `;
        container.appendChild(card);
    });
  }

function selecionarProduto(event, nome, preco, tempo) {
  produtoSelecionado = { nome, preco, tempo };

  document.querySelectorAll('.produto').forEach(p => p.classList.remove('selected'));
  event.currentTarget.classList.add('selected');
}

function iniciarOuAdicionarCronometro(tempoAdicionalMinutos) {
  segundosRestantesGeral += tempoAdicionalMinutos * 60;

  
  if (intervaloContador) {
    clearInterval(intervaloContador);
  }

  const atualizarDisplay = () => {
    const minutos = Math.floor(segundosRestantesGeral / 60);
    const segundos = segundosRestantesGeral % 60;
    
    const formatado = `${minutos}:${segundos.toString().padStart(2, '0')}`;
    document.getElementById('tempoPreparo').innerText = formatado;
  };

  atualizarDisplay();

  intervaloContador = setInterval(() => {
    segundosRestantesGeral--;
    atualizarDisplay();

    if (segundosRestantesGeral <= 0) {
      clearInterval(intervaloContador);
      intervaloContador = null;
      document.getElementById('tempoPreparo').innerText = "Pedido Pronto!";
    }
  }, 1000);
}

function getTempoEntrega() {
  const unidade = document.getElementById('unidade').value;

  if (unidade === 'Curitiba') return 15;
  if (unidade === 'São Paulo') return 18;

  return 0;
}

function irParaEndereco() {
  if (carrinho.length === 0) {
    mostrarModal('Carrinho vazio');
    return;
  }

  irParaTela('telaEndereco');
}

function irParaPagamentoComEndereco() {
  const cep = document.getElementById('cep').value;
  const numero = document.getElementById('numero').value;

  if (!cep || !numero) {
    mostrarModal('Preencha o endereço');
    return;
  }

  document.getElementById('totalPagamento').innerText = total;
  irParaTela('tela4');
}

function mostrarLoading() {
  document.getElementById('loading').style.display = 'flex';
}

function esconderLoading() {
  document.getElementById('loading').style.display = 'none';
}

function irParaCarrinho() {
  if (carrinho.length === 0) {
    mostrarModal('Carrinho vazio');
    return;
  }

  renderCarrinho();
  irParaTela('tela3');
}

function limparCarrinho() {
  carrinho = []; 
  total = 0;     
  renderCarrinho(); 

  const resultado = document.getElementById('resultado');
  if (resultado) {
    resultado.innerText = '';
    resultado.className = '';
  }
}

function abrirCardapio() {
  const conteudoCardapio = `
    <div style="display: flex; justify-content: space-between; align-items: center;">
      <h3>🔥 Mais Pedidos</h3>
      <span onclick="fecharModal()" style="cursor:pointer; font-size: 20px;">✖️</span>
    </div>

    <div class="grid">
      <div class="produto" onclick="selecionarProduto(event,'Tapioca',12,5); fecharModal()">
        <img src="https://www.sabornamesa.com.br/media/k2/items/cache/9217346f41a5b7e8e45bd1d2bf97a850_XL.jpg" width="80">
        <p>Tapioca</p>
      </div>

      <div class="produto" onclick="selecionarProduto(event,'Cuscuz',10,7); fecharModal()">
        <img src="https://totalpass.com/wp-content/uploads/2025/01/cuscuz-de-milho.jpg" width="80">
        <p>Cuscuz</p>
      </div>
    </div>

    <br>
    <button onclick="fecharModal(); irParaTela('tela2')">
      Ver Cardápio Completo
    </button>
  `;

  mostrarModal(conteudoCardapio, false);
}