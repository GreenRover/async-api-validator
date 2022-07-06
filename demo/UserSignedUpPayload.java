public class UserSignedUpPayload {
  private String firstName;
  private String lastName;
  private Object email;
  private java.time.OffsetDateTime createdAt;
  private Map<String, Object> additionalProperties;

  @JsonProperty("firstName")
  /**
   * foo
   */
  public String getFirstName() { return this.firstName; }
  public void setFirstName(String firstName) { this.firstName = firstName; }

  @JsonProperty("lastName")
  /**
   * bar
   */
  public String getLastName() { return this.lastName; }
  public void setLastName(String lastName) { this.lastName = lastName; }

  @JsonProperty("email")
  /**
   * baz
   */
  public Object getEmail() { return this.email; }
  public void setEmail(Object email) { this.email = email; }

  @JsonProperty("createdAt")
  public java.time.OffsetDateTime getCreatedAt() { return this.createdAt; }
  public void setCreatedAt(java.time.OffsetDateTime createdAt) { this.createdAt = createdAt; }

  public Map<String, Object> getAdditionalProperties() { return this.additionalProperties; }
  public void setAdditionalProperties(Map<String, Object> additionalProperties) { this.additionalProperties = additionalProperties; }

  @Override
  public boolean equals(Object o) {
    if (this == o) {
      return true;
    }
    if (o == null || getClass() != o.getClass()) {
      return false;
    }
    UserSignedUpPayload self = (UserSignedUpPayload) o;
      return 
        Objects.equals(this.firstName, self.firstName) &&
        Objects.equals(this.lastName, self.lastName) &&
        Objects.equals(this.email, self.email) &&
        Objects.equals(this.createdAt, self.createdAt) &&
        Objects.equals(this.additionalProperties, self.additionalProperties);
  }

  @Override
  public int hashCode() {
    return Objects.hash((Object)firstName, (Object)lastName, (Object)email, (Object)createdAt, (Object)additionalProperties);
  }

  @Override
  public String toString() {
    return "class UserSignedUpPayload {\n" +   
      "    firstName: " + toIndentedString(firstName) + "\n" +
      "    lastName: " + toIndentedString(lastName) + "\n" +
      "    email: " + toIndentedString(email) + "\n" +
      "    createdAt: " + toIndentedString(createdAt) + "\n" +
      "    additionalProperties: " + toIndentedString(additionalProperties) + "\n" +
    "}";
  }

  /**
   * Convert the given object to string with each line indented by 4 spaces
   * (except the first line).
   */
  private String toIndentedString(Object o) {
    if (o == null) {
      return "null";
    }
    return o.toString().replace("\n", "\n    ");
  }
}