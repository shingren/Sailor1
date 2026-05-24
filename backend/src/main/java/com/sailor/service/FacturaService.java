package com.sailor.service;

import com.sailor.dto.FacturaCreateRequestDTO;
import com.sailor.dto.FacturaResponseDTO;
import com.sailor.dto.PagoResponseDTO;
import com.sailor.entity.Cliente;
import com.sailor.entity.Cuenta;
import com.sailor.entity.Factura;
import com.sailor.entity.FacturaEstado;
import com.sailor.entity.Mesa;
import com.sailor.entity.Pago;
import com.sailor.entity.Pedido;
import com.sailor.exception.FacturaAlreadyExistsException;
import com.sailor.exception.InvalidPedidoEstadoException;
import com.sailor.exception.PagoInvalidoException;
import com.sailor.exception.FacturaYaPagadaException;
import com.sailor.exception.MontoExcedeSaldoException;
import com.sailor.repository.ClienteRepository;
import com.sailor.repository.CuentaRepository;
import com.sailor.repository.FacturaRepository;
import com.sailor.repository.MesaRepository;
import com.sailor.repository.PagoRepository;
import com.sailor.repository.PedidoRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class FacturaService {

    @Autowired
    private FacturaRepository facturaRepository;

    @Autowired
    private PagoRepository pagoRepository;

    @Autowired
    private PedidoRepository pedidoRepository;

    @Autowired
    private MesaRepository mesaRepository;

    @Autowired
    private ClienteRepository clienteRepository;

    @Autowired
    private CuentaRepository cuentaRepository;

    @Autowired
    private UsuarioService usuarioService;

    @Autowired
    private CuentaService cuentaService;

    private boolean esPedidoFacturable(Pedido pedido) {
        return "LISTO".equals(pedido.getEstado()) || "ENTREGADO".equals(pedido.getEstado());
    }

    private boolean esPedidoPendiente(Pedido pedido) {
        return "PENDIENTE".equals(pedido.getEstado())
                || "PREPARACION".equals(pedido.getEstado())
                || "EN_PREPARACION".equals(pedido.getEstado());
    }

    @Transactional
    public FacturaResponseDTO crearFactura(FacturaCreateRequestDTO request) {
        Pedido pedido = pedidoRepository.findById(request.getPedidoId())
                .orElseThrow(() -> new RuntimeException("Pedido not found with id: " + request.getPedidoId()));

        // 允许已完成制作 LISTO 或已上菜 ENTREGADO 的订单生成账单
        if (!esPedidoFacturable(pedido)) {
            throw new InvalidPedidoEstadoException(
                    "只有已完成制作或已上菜的订单可以生成账单。当前状态：" + pedido.getEstado());
        }

        if (facturaRepository.existsByPedido(pedido)) {
            throw new FacturaAlreadyExistsException("该订单已经生成过账单，订单编号：" + request.getPedidoId());
        }

        double subtotal = pedido.getItems().stream()
                .mapToDouble(item -> {
                    double itemTotal = item.getCantidad() * item.getPrecioUnitario();

                    double extrasTotal = item.getExtras().stream()
                            .mapToDouble(extra -> extra.getCantidad() * extra.getPrecioUnitario() * item.getCantidad())
                            .sum();

                    return itemTotal + extrasTotal;
                })
                .sum();

        double impuestos = subtotal * 0.13;
        double descuento = 0.0;
        double total = subtotal + impuestos - descuento;

        Factura factura = new Factura();
        factura.setPedido(pedido);
        factura.setSubtotal(subtotal);
        factura.setImpuestos(impuestos);
        factura.setDescuento(descuento);
        factura.setTotal(total);

        try {
            factura.setCreadaPorUsuario(usuarioService.getCurrentUsuario());
        } catch (Exception e) {
            System.err.println("Warning: No se pudo obtener usuario actual para trazabilidad: " + e.getMessage());
        }

        if (request.isEsConsumidorFinal()) {
            factura.setCliente(null);
            factura.setClienteIdentificacionFiscal("CONSUMIDOR FINAL");
            factura.setClienteNombre("Consumidor Final");
            factura.setClienteDireccion(null);
            factura.setClienteEmail(null);
            factura.setClienteTelefono(null);
        } else {
            if (request.getClienteIdentificacionFiscal() == null
                    || request.getClienteIdentificacionFiscal().trim().isEmpty()) {
                throw new RuntimeException("开具实名账单时，客户税务识别信息不能为空");
            }

            if (request.getClienteNombre() == null || request.getClienteNombre().trim().isEmpty()) {
                throw new RuntimeException("开具实名账单时，客户姓名不能为空");
            }

            Optional<Cliente> clienteExistenteOpt = clienteRepository.findByIdentificacionFiscal(
                    request.getClienteIdentificacionFiscal());

            if (clienteExistenteOpt.isPresent()) {
                Cliente clienteToAssociate = clienteExistenteOpt.get();
                factura.setCliente(clienteToAssociate);

                factura.setClienteIdentificacionFiscal(clienteToAssociate.getIdentificacionFiscal());
                factura.setClienteNombre(
                        request.getClienteNombre() != null ? request.getClienteNombre()
                                : clienteToAssociate.getNombre());
                factura.setClienteDireccion(
                        request.getClienteDireccion() != null ? request.getClienteDireccion()
                                : clienteToAssociate.getDireccion());
                factura.setClienteEmail(
                        request.getClienteEmail() != null ? request.getClienteEmail() : clienteToAssociate.getEmail());
                factura.setClienteTelefono(
                        request.getClienteTelefono() != null ? request.getClienteTelefono()
                                : clienteToAssociate.getTelefono());
            } else {
                if (request.isGuardarCliente()) {
                    Cliente nuevoCliente = new Cliente();
                    nuevoCliente.setIdentificacionFiscal(request.getClienteIdentificacionFiscal());
                    nuevoCliente.setNombre(request.getClienteNombre());
                    nuevoCliente.setDireccion(request.getClienteDireccion());
                    nuevoCliente.setEmail(request.getClienteEmail());
                    nuevoCliente.setTelefono(request.getClienteTelefono());
                    nuevoCliente.setActivo(true);

                    Cliente savedCliente = clienteRepository.save(nuevoCliente);
                    factura.setCliente(savedCliente);
                }

                factura.setClienteIdentificacionFiscal(request.getClienteIdentificacionFiscal());
                factura.setClienteNombre(request.getClienteNombre());
                factura.setClienteDireccion(request.getClienteDireccion());
                factura.setClienteEmail(request.getClienteEmail());
                factura.setClienteTelefono(request.getClienteTelefono());
            }
        }

        try {
            Factura savedFactura = facturaRepository.save(factura);

            // 生成账单后，把订单状态改为 FACTURADO
            pedido.setEstado("FACTURADO");
            pedidoRepository.save(pedido);

            return mapToResponseDTO(savedFactura);
        } catch (DataIntegrityViolationException e) {
            throw new FacturaAlreadyExistsException("该订单已经生成过账单，订单编号：" + request.getPedidoId());
        }
    }

    /**
     * Create factura from Cuenta (new flow - tab/open order per table)
     */
    @Transactional
    public FacturaResponseDTO crearFacturaPorCuenta(Long cuentaId, FacturaCreateRequestDTO request) {
        Cuenta cuenta = cuentaRepository.findById(cuentaId)
                .orElseThrow(() -> new RuntimeException("Cuenta not found with id: " + cuentaId));

        // 允许 LISTO 或 ENTREGADO 的订单生成账单
        long facturablesCount = cuenta.getPedidos().stream()
                .filter(this::esPedidoFacturable)
                .count();

        if (facturablesCount == 0) {
            throw new InvalidPedidoEstadoException(
                    "该账单没有可结账的已完成制作或已上菜订单");
        }

        // 只要还有待处理或制作中的订单，就不能整桌结账
        long pendientesCount = cuenta.getPedidos().stream()
                .filter(this::esPedidoPendiente)
                .count();

        if (pendientesCount > 0) {
            throw new InvalidPedidoEstadoException(
                    "该账单还有 " + pendientesCount + " 个待处理或制作中的订单，不能结账");
        }

        if (facturaRepository.existsByCuenta(cuenta)) {
            throw new FacturaAlreadyExistsException("该账单已经生成过发票，账单编号：" + cuentaId);
        }

        double subtotal = cuenta.getPedidos().stream()
                .filter(this::esPedidoFacturable)
                .flatMap(pedido -> pedido.getItems().stream())
                .mapToDouble(item -> {
                    double itemTotal = item.getCantidad() * item.getPrecioUnitario();

                    double extrasTotal = item.getExtras().stream()
                            .mapToDouble(extra -> extra.getCantidad() * extra.getPrecioUnitario() * item.getCantidad())
                            .sum();

                    return itemTotal + extrasTotal;
                })
                .sum();

        double impuestos = subtotal * 0.13;
        double descuento = 0.0;
        double total = subtotal + impuestos - descuento;

        Factura factura = new Factura();
        factura.setCuenta(cuenta);
        factura.setPedido(null);
        factura.setSubtotal(subtotal);
        factura.setImpuestos(impuestos);
        factura.setDescuento(descuento);
        factura.setTotal(total);

        try {
            factura.setCreadaPorUsuario(usuarioService.getCurrentUsuario());
        } catch (Exception e) {
            System.err.println("Warning: No se pudo obtener usuario actual para trazabilidad: " + e.getMessage());
        }

        if (request.isEsConsumidorFinal()) {
            factura.setCliente(null);
            factura.setClienteIdentificacionFiscal("CONSUMIDOR FINAL");
            factura.setClienteNombre("Consumidor Final");
            factura.setClienteDireccion(null);
            factura.setClienteEmail(null);
            factura.setClienteTelefono(null);
        } else {
            if (request.getClienteIdentificacionFiscal() == null
                    || request.getClienteIdentificacionFiscal().trim().isEmpty()) {
                throw new RuntimeException("开具实名账单时，客户税务识别信息不能为空");
            }

            if (request.getClienteNombre() == null || request.getClienteNombre().trim().isEmpty()) {
                throw new RuntimeException("开具实名账单时，客户姓名不能为空");
            }

            Optional<Cliente> clienteExistenteOpt = clienteRepository.findByIdentificacionFiscal(
                    request.getClienteIdentificacionFiscal());

            if (clienteExistenteOpt.isPresent()) {
                Cliente clienteToAssociate = clienteExistenteOpt.get();
                factura.setCliente(clienteToAssociate);
                factura.setClienteIdentificacionFiscal(clienteToAssociate.getIdentificacionFiscal());
                factura.setClienteNombre(
                        request.getClienteNombre() != null ? request.getClienteNombre()
                                : clienteToAssociate.getNombre());
                factura.setClienteDireccion(
                        request.getClienteDireccion() != null ? request.getClienteDireccion()
                                : clienteToAssociate.getDireccion());
                factura.setClienteEmail(
                        request.getClienteEmail() != null ? request.getClienteEmail() : clienteToAssociate.getEmail());
                factura.setClienteTelefono(
                        request.getClienteTelefono() != null ? request.getClienteTelefono()
                                : clienteToAssociate.getTelefono());
            } else {
                if (request.isGuardarCliente()) {
                    Cliente nuevoCliente = new Cliente();
                    nuevoCliente.setIdentificacionFiscal(request.getClienteIdentificacionFiscal());
                    nuevoCliente.setNombre(request.getClienteNombre());
                    nuevoCliente.setDireccion(request.getClienteDireccion());
                    nuevoCliente.setEmail(request.getClienteEmail());
                    nuevoCliente.setTelefono(request.getClienteTelefono());
                    nuevoCliente.setActivo(true);

                    Cliente savedCliente = clienteRepository.save(nuevoCliente);
                    factura.setCliente(savedCliente);
                }

                factura.setClienteIdentificacionFiscal(request.getClienteIdentificacionFiscal());
                factura.setClienteNombre(request.getClienteNombre());
                factura.setClienteDireccion(request.getClienteDireccion());
                factura.setClienteEmail(request.getClienteEmail());
                factura.setClienteTelefono(request.getClienteTelefono());
            }
        }

        try {
            Factura savedFactura = facturaRepository.save(factura);

            // 生成账单后，把本账单中可结账的订单改为 FACTURADO
            cuenta.getPedidos().stream()
                    .filter(this::esPedidoFacturable)
                    .forEach(pedido -> {
                        pedido.setEstado("FACTURADO");
                        pedidoRepository.save(pedido);
                    });

            // 标记账单已生成发票
            cuentaService.markCuentaConFactura(cuentaId);

            return mapToResponseDTO(savedFactura);
        } catch (DataIntegrityViolationException e) {
            throw new FacturaAlreadyExistsException("该账单已经生成过发票，账单编号：" + cuentaId);
        }
    }

    public List<FacturaResponseDTO> listarFacturas() {
        return facturaRepository.findAll().stream()
                .map(this::mapToResponseDTO)
                .collect(Collectors.toList());
    }

    public FacturaResponseDTO obtenerFactura(Long id) {
        Factura factura = facturaRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Factura not found with id: " + id));
        return mapToResponseDTO(factura);
    }

    @Transactional
    public FacturaResponseDTO registrarPago(Long facturaId, double monto, String metodo) {
        if (monto <= 0) {
            throw new PagoInvalidoException("付款金额必须大于 0");
        }

        Factura factura = facturaRepository.findById(facturaId)
                .orElseThrow(() -> new RuntimeException("未找到该账单，ID：" + facturaId));

        if (factura.getEstado() == FacturaEstado.PAGADA) {
            throw new FacturaYaPagadaException("该账单已经付款，不能重复登记付款");
        }

        double totalPagadoActual = factura.getPagos().stream()
                .mapToDouble(Pago::getMonto)
                .sum();

        double saldoPendiente = factura.getTotal() - totalPagadoActual;

        if (monto > saldoPendiente) {
            throw new MontoExcedeSaldoException(
                    String.format("付款金额（$%.2f）超过未付余额（$%.2f），不允许超额付款。",
                            monto, saldoPendiente));
        }

        Pago pago = new Pago();
        pago.setFactura(factura);
        pago.setMonto(monto);
        pago.setMetodo(metodo);

        try {
            pago.setRegistradoPorUsuario(usuarioService.getCurrentUsuario());
        } catch (Exception e) {
            System.err.println("Warning: No se pudo obtener usuario actual para trazabilidad: " + e.getMessage());
        }

        Pago savedPago = pagoRepository.save(pago);
        factura.getPagos().add(savedPago);

        double totalPagado = factura.getPagos().stream()
                .mapToDouble(Pago::getMonto)
                .sum();

        if (totalPagado >= factura.getTotal()) {
            factura.setEstado(FacturaEstado.PAGADA);

            if (factura.getFechaHoraPago() == null) {
                factura.setFechaHoraPago(LocalDateTime.now());
            }

            if (factura.getCuenta() != null) {
                Cuenta cuenta = factura.getCuenta();

                for (Pedido pedido : cuenta.getPedidos()) {
                    if (!"PAGADO".equals(pedido.getEstado())) {
                        pedido.setEstado("PAGADO");
                        pedidoRepository.save(pedido);
                    }
                }

                cuentaService.closeCuenta(cuenta.getId());

                Mesa mesa = cuenta.getMesa();
                if (mesa != null && "ocupada".equalsIgnoreCase(mesa.getEstado())) {
                    mesa.setEstado("disponible");
                    mesaRepository.save(mesa);
                }
            } else if (factura.getPedido() != null) {
                Pedido pedido = factura.getPedido();
                pedido.setEstado("PAGADO");
                pedidoRepository.save(pedido);

                Mesa mesa = pedido.getMesa();
                if (mesa != null && "ocupada".equalsIgnoreCase(mesa.getEstado())) {
                    mesa.setEstado("disponible");
                    mesaRepository.save(mesa);
                }
            }
        }

        Factura savedFactura = facturaRepository.save(factura);
        return mapToResponseDTO(savedFactura);
    }

    private FacturaResponseDTO mapToResponseDTO(Factura factura) {
        FacturaResponseDTO dto = new FacturaResponseDTO();
        dto.setId(factura.getId());

        if (factura.getPedido() != null) {
            dto.setPedidoId(factura.getPedido().getId());
            dto.setCuentaId(null);
        } else if (factura.getCuenta() != null) {
            dto.setPedidoId(null);
            dto.setCuentaId(factura.getCuenta().getId());
        }

        dto.setFechaHora(factura.getFechaHora());

        if (factura.getCreadaPorUsuario() != null) {
            dto.setCreadaPor(factura.getCreadaPorUsuario().getEmail());
        }

        if (factura.getCliente() != null) {
            dto.setClienteId(factura.getCliente().getId());
        }

        dto.setClienteIdentificacionFiscal(factura.getClienteIdentificacionFiscal());
        dto.setClienteNombre(factura.getClienteNombre());
        dto.setClienteDireccion(factura.getClienteDireccion());
        dto.setClienteEmail(factura.getClienteEmail());
        dto.setClienteTelefono(factura.getClienteTelefono());

        dto.setSubtotal(factura.getSubtotal());
        dto.setImpuestos(factura.getImpuestos());
        dto.setDescuento(factura.getDescuento());
        dto.setTotal(factura.getTotal());
        dto.setEstado(factura.getEstado().name());

        List<PagoResponseDTO> pagos = factura.getPagos().stream()
                .map(this::mapPagoToResponseDTO)
                .collect(Collectors.toList());

        dto.setPagos(pagos);

        double totalPagado = factura.getPagos().stream()
                .mapToDouble(Pago::getMonto)
                .sum();

        double saldoPendiente = Math.max(factura.getTotal() - totalPagado, 0.0);

        dto.setTotalPagado(totalPagado);
        dto.setSaldoPendiente(saldoPendiente);

        return dto;
    }

    private PagoResponseDTO mapPagoToResponseDTO(Pago pago) {
        PagoResponseDTO dto = new PagoResponseDTO();
        dto.setId(pago.getId());
        dto.setMonto(pago.getMonto());
        dto.setMetodo(pago.getMetodo());
        dto.setFechaHora(pago.getFechaHora());

        if (pago.getRegistradoPorUsuario() != null) {
            dto.setRegistradoPor(pago.getRegistradoPorUsuario().getEmail());
        }

        return dto;
    }
}