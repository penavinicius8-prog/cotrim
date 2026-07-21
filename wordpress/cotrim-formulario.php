<?php
/**
 * Plugin Name: Cotrim Advogados — Formulários do Site
 * Description: Recebe os formulários (contato e newsletter) do site estático, guarda como "Leads" no painel e envia um e-mail formatado para o endereço configurado.
 * Version: 1.0.0
 * Author: Cotrim / Leve Studios
 *
 * ============================================================
 *  COMO INSTALAR (escolha UM dos dois jeitos)
 * ------------------------------------------------------------
 *  A) COMO SNIPPET (Code Snippets):
 *       - crie um snippet novo, tipo "Executar em todo o site (PHP)",
 *       - copie o código a partir da linha "if (!defined('ABSPATH'))..."
 *         (ou seja, TUDO menos a primeira linha "<?php"),
 *       - salve e ative.
 *
 *  B) COMO PLUGIN:
 *       - salve este arquivo como  wp-content/plugins/cotrim-formulario.php,
 *       - ative em "Plugins".
 *
 *  Depois: vá em  Configurações → Formulário Cotrim  e informe o e-mail
 *  que vai receber os envios. Pronto. Os leads também ficam guardados no
 *  menu "Leads (Site)".
 * ============================================================
 */

if (!defined('ABSPATH')) exit;

/* ------------------------------------------------------------------
 * 1) Tipo de conteúdo "Lead" — guarda cada envio no painel
 * ------------------------------------------------------------------ */
add_action('init', function () {
    register_post_type('cotrim_lead', array(
        'labels' => array(
            'name'          => 'Leads (Site)',
            'singular_name' => 'Lead',
            'menu_name'     => 'Leads (Site)',
            'all_items'     => 'Todos os leads',
        ),
        'public'       => false,
        'show_ui'      => true,
        'show_in_menu' => true,
        'menu_icon'    => 'dashicons-email-alt',
        'menu_position'=> 26,
        'supports'     => array('title'),
        'capability_type' => 'post',
        'map_meta_cap' => true,
    ));
});

/* Colunas da listagem de leads */
add_filter('manage_cotrim_lead_posts_columns', function ($cols) {
    return array(
        'cb'              => isset($cols['cb']) ? $cols['cb'] : '',
        'title'           => 'Nome',
        'cotrim_tipo'     => 'Tipo',
        'cotrim_email'    => 'E-mail',
        'cotrim_telefone' => 'WhatsApp',
        'date'            => 'Recebido',
    );
});
add_action('manage_cotrim_lead_posts_custom_column', function ($col, $id) {
    if ($col === 'cotrim_tipo') {
        $t = get_post_meta($id, 'cotrim_tipo', true);
        echo esc_html(ucfirst($t ? $t : 'contato'));
    } elseif ($col === 'cotrim_email') {
        $e = get_post_meta($id, 'cotrim_email', true);
        echo $e ? '<a href="mailto:' . esc_attr($e) . '">' . esc_html($e) . '</a>' : '—';
    } elseif ($col === 'cotrim_telefone') {
        $v = get_post_meta($id, 'cotrim_telefone', true);
        echo esc_html($v ? $v : '—');
    }
}, 10, 2);

/* Caixa com todos os dados na tela do lead */
add_action('add_meta_boxes', function () {
    add_meta_box('cotrim_lead_dados', 'Dados do envio', 'cotrim_lead_render_meta', 'cotrim_lead', 'normal', 'high');
});
function cotrim_lead_render_meta($post) {
    $campos = array(
        'cotrim_nome'     => 'Nome',
        'cotrim_email'    => 'E-mail',
        'cotrim_telefone' => 'WhatsApp',
        'cotrim_empresa'  => 'Empresa',
        'cotrim_area'     => 'Área de interesse',
        'cotrim_mensagem' => 'Mensagem',
        'cotrim_tipo'     => 'Tipo de formulário',
        'cotrim_ip'       => 'IP de origem',
    );
    echo '<table class="widefat striped"><tbody>';
    foreach ($campos as $chave => $rotulo) {
        $v = get_post_meta($post->ID, $chave, true);
        if ($v === '' || $v === null) continue;
        echo '<tr><th style="width:180px;text-align:left;vertical-align:top;">' . esc_html($rotulo) . '</th>';
        echo '<td>' . nl2br(esc_html($v)) . '</td></tr>';
    }
    echo '</tbody></table>';
}

/* ------------------------------------------------------------------
 * 2) Página de configuração (Configurações → Formulário Cotrim)
 * ------------------------------------------------------------------ */
add_action('admin_init', function () {
    register_setting('cotrim_form_grupo', 'cotrim_form_destino', array(
        'sanitize_callback' => 'sanitize_text_field',
        'default'           => get_option('admin_email'),
    ));
    register_setting('cotrim_form_grupo', 'cotrim_form_assunto', array(
        'sanitize_callback' => 'sanitize_text_field',
        'default'           => 'Novo contato pelo site',
    ));
});
add_action('admin_menu', function () {
    add_options_page('Formulário Cotrim', 'Formulário Cotrim', 'manage_options', 'cotrim-form', 'cotrim_form_config_page');
});
function cotrim_form_config_page() {
    ?>
    <div class="wrap">
        <h1>Formulário Cotrim</h1>
        <p>Cada envio do site é guardado em <strong>Leads (Site)</strong> e também enviado por e-mail para o(s) endereço(s) abaixo.</p>
        <form method="post" action="options.php">
            <?php settings_fields('cotrim_form_grupo'); ?>
            <table class="form-table" role="presentation">
                <tr>
                    <th scope="row"><label for="cotrim_form_destino">E-mail(s) de destino</label></th>
                    <td>
                        <input name="cotrim_form_destino" id="cotrim_form_destino" type="text" class="regular-text"
                               value="<?php echo esc_attr(get_option('cotrim_form_destino', get_option('admin_email'))); ?>">
                        <p class="description">Para onde os formulários serão enviados. Separe por vírgula para mais de um e-mail.</p>
                    </td>
                </tr>
                <tr>
                    <th scope="row"><label for="cotrim_form_assunto">Assunto do e-mail</label></th>
                    <td>
                        <input name="cotrim_form_assunto" id="cotrim_form_assunto" type="text" class="regular-text"
                               value="<?php echo esc_attr(get_option('cotrim_form_assunto', 'Novo contato pelo site')); ?>">
                    </td>
                </tr>
            </table>
            <?php submit_button('Salvar'); ?>
        </form>
        <hr>
        <p style="color:#666">O site envia para estes endereços (já configurado no site):</p>
        <p><code><?php echo esc_html(home_url('/?rest_route=/cotrim/v1/contato')); ?></code><br>
           <code><?php echo esc_html(home_url('/?rest_route=/cotrim/v1/newsletter')); ?></code></p>
    </div>
    <?php
}

/* ------------------------------------------------------------------
 * 3) Endpoints REST que recebem os formulários do site
 * ------------------------------------------------------------------ */
add_action('rest_api_init', function () {
    register_rest_route('cotrim/v1', '/contato', array(
        'methods'             => 'POST',
        'callback'            => 'cotrim_form_receber_contato',
        'permission_callback' => '__return_true',
    ));
    register_rest_route('cotrim/v1', '/newsletter', array(
        'methods'             => 'POST',
        'callback'            => 'cotrim_form_receber_newsletter',
        'permission_callback' => '__return_true',
    ));
});

/* Helpers ---------------------------------------------------------- */

/* Só aceita envios vindos do site (filtro leve anti-spam) */
function cotrim_form_origem_ok() {
    $origem = '';
    if (!empty($_SERVER['HTTP_ORIGIN']))       $origem = $_SERVER['HTTP_ORIGIN'];
    elseif (!empty($_SERVER['HTTP_REFERER']))  $origem = $_SERVER['HTTP_REFERER'];
    if ($origem === '') return true; // alguns navegadores não mandam — não bloqueia
    return (stripos($origem, 'cotrimadvogados.adv.br') !== false);
}

/* Limite simples por IP: no máx. 5 envios a cada 10 minutos */
function cotrim_form_limite_ok() {
    $ip = isset($_SERVER['REMOTE_ADDR']) ? $_SERVER['REMOTE_ADDR'] : 'sem-ip';
    $chave = 'cotrim_form_' . md5($ip);
    $n = (int) get_transient($chave);
    if ($n >= 5) return false;
    set_transient($chave, $n + 1, 10 * MINUTE_IN_SECONDS);
    return true;
}

function cotrim_form_destinatarios() {
    $raw = get_option('cotrim_form_destino', get_option('admin_email'));
    $lista = array_filter(array_map('trim', explode(',', (string) $raw)), 'is_email');
    if (empty($lista)) $lista = array(get_option('admin_email'));
    return array_values($lista);
}

/* Monta o corpo do e-mail (HTML) com a marca do escritório */
function cotrim_form_html_email($titulo, $campos) {
    $linhas = '';
    foreach ($campos as $rotulo => $valor) {
        $valor = trim((string) $valor);
        if ($valor === '') continue;
        $linhas .= '<tr>'
            . '<td style="padding:11px 16px;background:#f7f4ec;border:1px solid #e6e0d0;font-weight:700;color:#032846;width:180px;vertical-align:top;">' . esc_html($rotulo) . '</td>'
            . '<td style="padding:11px 16px;border:1px solid #e6e0d0;color:#111;">' . nl2br(esc_html($valor)) . '</td>'
            . '</tr>';
    }
    $quando = current_time('d/m/Y') . ' às ' . current_time('H:i');
    return '<div style="background:#00192d;padding:24px 12px;font-family:Arial,Helvetica,sans-serif;">'
        . '<div style="max-width:600px;margin:0 auto;background:#ffffff;border-radius:10px;overflow:hidden;">'
        . '<div style="background:#00192d;color:#e3cda4;padding:20px 24px;font-size:17px;font-weight:700;letter-spacing:.5px;border-bottom:3px solid #d7bf99;">COTRIM ADVOGADOS ASSOCIADOS</div>'
        . '<div style="padding:24px;">'
        . '<p style="margin:0 0 18px;color:#032846;font-size:16px;font-weight:700;">' . esc_html($titulo) . '</p>'
        . '<table style="width:100%;border-collapse:collapse;font-size:14px;line-height:1.45;">' . $linhas . '</table>'
        . '<p style="margin:22px 0 0;color:#8a8a8a;font-size:12px;">Recebido pelo site em ' . esc_html($quando) . '.</p>'
        . '</div></div></div>';
}

/* Callback: formulário de CONTATO ---------------------------------- */
function cotrim_form_receber_contato($req) {
    // Honeypot: se o campo escondido veio preenchido, é bot — finge sucesso.
    if (trim((string) $req->get_param('website')) !== '') {
        return new WP_REST_Response(array('ok' => true), 200);
    }
    if (!cotrim_form_origem_ok())  return new WP_REST_Response(array('ok' => false, 'erro' => 'Origem não autorizada.'), 403);
    if (!cotrim_form_limite_ok())  return new WP_REST_Response(array('ok' => false, 'erro' => 'Muitos envios. Tente novamente em alguns minutos.'), 429);

    $nome     = sanitize_text_field((string) $req->get_param('nome'));
    $email    = sanitize_email((string) $req->get_param('email'));
    $telefone = sanitize_text_field((string) $req->get_param('telefone'));
    $empresa  = sanitize_text_field((string) $req->get_param('empresa'));
    $area     = sanitize_text_field((string) $req->get_param('area'));
    $mensagem = sanitize_textarea_field((string) $req->get_param('mensagem'));

    if ($nome === '' || !is_email($email)) {
        return new WP_REST_Response(array('ok' => false, 'erro' => 'Preencha nome e um e-mail válido.'), 422);
    }

    // Guarda o lead
    $post_id = wp_insert_post(array(
        'post_type'   => 'cotrim_lead',
        'post_status' => 'publish',
        'post_title'  => ($nome !== '' ? $nome : $email) . ' — ' . current_time('d/m/Y H:i'),
    ));
    if ($post_id && !is_wp_error($post_id)) {
        update_post_meta($post_id, 'cotrim_nome', $nome);
        update_post_meta($post_id, 'cotrim_email', $email);
        update_post_meta($post_id, 'cotrim_telefone', $telefone);
        update_post_meta($post_id, 'cotrim_empresa', $empresa);
        update_post_meta($post_id, 'cotrim_area', $area);
        update_post_meta($post_id, 'cotrim_mensagem', $mensagem);
        update_post_meta($post_id, 'cotrim_tipo', 'contato');
        update_post_meta($post_id, 'cotrim_ip', isset($_SERVER['REMOTE_ADDR']) ? sanitize_text_field($_SERVER['REMOTE_ADDR']) : '');
    }

    // E-mail formatado
    $assunto = get_option('cotrim_form_assunto', 'Novo contato pelo site') . ' — ' . $nome;
    $corpo   = cotrim_form_html_email('Novo contato pelo site', array(
        'Nome'              => $nome,
        'E-mail'            => $email,
        'WhatsApp'          => $telefone,
        'Empresa'           => $empresa,
        'Área de interesse' => $area,
        'Mensagem'          => $mensagem,
    ));
    $headers = array('Content-Type: text/html; charset=UTF-8');
    if (is_email($email)) $headers[] = 'Reply-To: ' . $nome . ' <' . $email . '>';

    wp_mail(cotrim_form_destinatarios(), $assunto, $corpo, $headers);

    return new WP_REST_Response(array('ok' => true), 200);
}

/* Callback: NEWSLETTER (rodapé) ------------------------------------ */
function cotrim_form_receber_newsletter($req) {
    if (trim((string) $req->get_param('website')) !== '') {
        return new WP_REST_Response(array('ok' => true), 200);
    }
    if (!cotrim_form_origem_ok())  return new WP_REST_Response(array('ok' => false, 'erro' => 'Origem não autorizada.'), 403);
    if (!cotrim_form_limite_ok())  return new WP_REST_Response(array('ok' => false, 'erro' => 'Muitos envios. Tente novamente mais tarde.'), 429);

    $email = sanitize_email((string) $req->get_param('email'));
    if (!is_email($email)) {
        return new WP_REST_Response(array('ok' => false, 'erro' => 'E-mail inválido.'), 422);
    }

    $post_id = wp_insert_post(array(
        'post_type'   => 'cotrim_lead',
        'post_status' => 'publish',
        'post_title'  => $email . ' — ' . current_time('d/m/Y H:i'),
    ));
    if ($post_id && !is_wp_error($post_id)) {
        update_post_meta($post_id, 'cotrim_email', $email);
        update_post_meta($post_id, 'cotrim_tipo', 'newsletter');
        update_post_meta($post_id, 'cotrim_ip', isset($_SERVER['REMOTE_ADDR']) ? sanitize_text_field($_SERVER['REMOTE_ADDR']) : '');
    }

    $corpo = cotrim_form_html_email('Nova inscrição na newsletter', array('E-mail' => $email));
    wp_mail(cotrim_form_destinatarios(), 'Nova inscrição na newsletter', $corpo, array('Content-Type: text/html; charset=UTF-8'));

    return new WP_REST_Response(array('ok' => true), 200);
}
