package com.sailor.service;

import com.sailor.dto.CierreCajaCreateRequestDTO;
import com.sailor.dto.CierreCajaResponseDTO;
import com.sailor.dto.ResumenDiaDTO;
import com.sailor.entity.CierreCaja;
import com.sailor.entity.Factura;
import com.sailor.entity.Pago;
import com.sailor.entity.Usuario;
import com.sailor.repository.CierreCajaRepository;
import com.sailor.repository.FacturaRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class CierreCajaService {

    @Autowired
    private CierreCajaRepository cierreCajaRepository;

    @Autowired
    private FacturaRepository facturaRepository;

    public ResumenDiaDTO generateDailySummary(LocalDate fecha, double saldoInicial) {
        // Get start and end of day
        LocalDateTime startOfDay = fecha.atStartOfDay();
        LocalDateTime endOfDay = fecha.atTime(23, 59, 59);

        // Query paid facturas for the given date
        List<Factura> facturasPagadas = facturaRepository.findAll().stream()
                .filter(f -> f.getEstado().equals("PAGADA"))
                .filter(f -> f.getFechaHora().isAfter(startOfDay) && f.getFechaHora().isBefore(endOfDay))
                .collect(Collectors.toList());

        // Calculate totals
        double totalVentasDia = facturasPagadas.stream()
                .mapToDouble(Factura::getTotal)
                .sum();

        int cantidadFacturas = facturasPagadas.size();

        // Calculate totals by payment method
        double totalEfectivo = 0.0;
        double totalTarjeta = 0.0;

        for (Factura factura : facturasPagadas) {
            for (Pago pago : factura.getPagos()) {
                if (pago.getMetodo().equals("EFECTIVO")) {
                    totalEfectivo += pago.getMonto();
                } else if (pago.getMetodo().equals("TARJETA")) {
                    totalTarjeta += pago.getMonto();
                }
            }
        }

        // Calculate expected balance
        double saldoEsperado = totalEfectivo + saldoInicial;

        // Check if cierre already exists for this date
        boolean cierreExiste = cierreCajaRepository.findByFecha(fecha).isPresent();

        return new ResumenDiaDTO(
                fecha,
                totalVentasDia,
                totalEfectivo,
                totalTarjeta,
                cantidadFacturas,
                saldoEsperado,
                cierreExiste
        );
    }

    public CierreCajaResponseDTO createCierre(CierreCajaCreateRequestDTO request, Usuario usuario) {
        LocalDate today = LocalDate.now();

        // Check if cierre already exists for today
        if (cierreCajaRepository.findByFecha(today).isPresent()) {
            throw new RuntimeException("Ya existe un cierre de caja para la fecha de hoy");
        }

        // Generate daily summary
        double saldoInicial = request.getSaldoInicial() != null ? request.getSaldoInicial() : 0.0;
        ResumenDiaDTO resumen = generateDailySummary(today, saldoInicial);

        // Calculate difference
        double diferencia = request.getSaldoReal() - resumen.getSaldoEsperado();

        // Create and save CierreCaja
        CierreCaja cierre = new CierreCaja();
        cierre.setFecha(today);
        cierre.setTotalVentasDia(resumen.getTotalVentasDia());
        cierre.setTotalEfectivo(resumen.getTotalEfectivo());
        cierre.setTotalTarjeta(resumen.getTotalTarjeta());
        cierre.setCantidadFacturas(resumen.getCantidadFacturas());
        cierre.setSaldoEsperado(resumen.getSaldoEsperado());
        cierre.setSaldoReal(request.getSaldoReal());
        cierre.setDiferencia(diferencia);
        cierre.setUsuario(usuario);
        cierre.setTimestampCreado(LocalDateTime.now());

        CierreCaja saved = cierreCajaRepository.save(cierre);

        return mapToResponseDTO(saved);
    }

    public List<CierreCajaResponseDTO> listAll() {
        return cierreCajaRepository.findAllByOrderByFechaDesc().stream()
                .map(this::mapToResponseDTO)
                .collect(Collectors.toList());
    }

    private CierreCajaResponseDTO mapToResponseDTO(CierreCaja cierre) {
        return new CierreCajaResponseDTO(
                cierre.getId(),
                cierre.getFecha(),
                cierre.getTotalVentasDia(),
                cierre.getTotalEfectivo(),
                cierre.getTotalTarjeta(),
                cierre.getCantidadFacturas(),
                cierre.getSaldoEsperado(),
                cierre.getSaldoReal(),
                cierre.getDiferencia(),
                cierre.getUsuario().getEmail(),
                cierre.getTimestampCreado()
        );
    }
}
