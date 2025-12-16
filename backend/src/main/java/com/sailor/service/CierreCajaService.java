package com.sailor.service;

import com.sailor.dto.CierreCajaCreateRequestDTO;
import com.sailor.dto.CierreCajaResponseDTO;
import com.sailor.dto.ResumenDiaDTO;
import com.sailor.entity.CierreCaja;
import com.sailor.entity.Factura;
import com.sailor.entity.FacturaEstado;
import com.sailor.entity.Pago;
import com.sailor.entity.Usuario;
import com.sailor.repository.CierreCajaRepository;
import com.sailor.repository.FacturaRepository;
import com.sailor.repository.PagoRepository;
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

    @Autowired
    private PagoRepository pagoRepository;

    public ResumenDiaDTO generateDailySummary(LocalDate fecha, double saldoInicial) {
        // Get start and end of day
        LocalDateTime startOfDay = fecha.atStartOfDay();
        LocalDateTime endOfDay = fecha.plusDays(1).atStartOfDay(); // Start of next day

        // Calculate totals by payment method based on pago.fechaHora
        double totalEfectivo = pagoRepository.sumByMetodoAndFechaHoraBetween("EFECTIVO", startOfDay, endOfDay);
        double totalTarjeta = pagoRepository.sumByMetodoAndFechaHoraBetween("TARJETA", startOfDay, endOfDay);

        // Total sales of the day (sum of all payments made on this day)
        double totalVentasDia = totalEfectivo + totalTarjeta;

        // Count facturas that were fully paid on this day (based on fechaHoraPago)
        int cantidadFacturas = facturaRepository.countByEstadoAndFechaHoraPagoBetween(FacturaEstado.PAGADA, startOfDay, endOfDay);

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
