# PUSHPA Risk Engine & Scoring Specification

## 1. Scoring Formula
The PUSHPA risk score is a deterministic, explainable linear combination of 6 orthogonal factors:

$$\text{Risk} = \min\left(100, \sum_{i=1}^6 c_i\right)$$

$$\text{Components} = \{ c_{\text{forest\_change}}, c_{\text{veg\_loss}}, c_{\text{permit}}, c_{\text{route}}, c_{\text{historical}}, c_{\text{spatial\_prox}} \}$$

## 2. Factor Details

### Factor 1: Forest Disturbance Severity ($W_{\max} = 30$)
- Vegetation loss drop $\ge 50\% \to 30$
- Vegetation loss drop $\ge 30\% \to 22$
- Vegetation loss drop $\ge 15\% \to 12$
- Baseline/minor $< 15\% \to 0$

### Factor 2: Disturbance Area Extent ($W_{\max} = 20$)
- Extracted area $\ge 2.5\text{ ha} \to 20$
- Extracted area $\ge 1.0\text{ ha} \to 15$
- Extracted area $> 0.05\text{ ha} \to 8$
- Sub-threshold $\le 0.05\text{ ha} \to 0$

### Factor 3: Permit Anomaly ($W_{\max} = 20$)
- `NOT_FOUND` (confirmed unregistered timber transport) $\to 20$
- `EXPIRED` or `REVOKED` $\to 17$
- `UNKNOWN` (service timeout/missing database record) $\to 0$ (reduces confidence by $-15\%$)
- `VALID` $\to 0$

### Factor 4: Route Anomaly ($W_{\max} = 15$)
- Destination mismatch / Unregistered destination $\to 15$
- Major corridor deviation ($> 10\text{ km}$) $\to 12$
- Minor corridor deviation ($> 2\text{ km}$) $\to 6$
- Unknown route history $\to 3$
- On-corridor compliant route $\to 0$

### Factor 5: Historical Incident Risk ($W_{\max} = 10$)
Time and distance decay applied to all incidents within $R_{\max} = 10\text{ km}$:
$$\text{Score} = \min\left(10, \sum_i S_i \cdot \left(1 - \frac{d_i}{10}\right) \cdot 0.5^{\frac{\Delta t_i}{365}}\right)$$

### Factor 6: Spatial Proximity ($W_{\max} = 5$)
Distance from vehicle or route to polygon boundary:
- Distance $\le 3\text{ km} \to 5$
- Distance $\le 8\text{ km} \to 2$
- Distance $> 8\text{ km} \to 0$

## 3. Confidence Assessment
Confidence starts at $100\%$ and deducts points for missing or unverified sensors:
- Missing/Unknown Permit Service: $-15\%$
- Missing Telemetry: $-10\%$
- Sub-threshold Area ($< 0.1\text{ ha}$): $-5\%$
